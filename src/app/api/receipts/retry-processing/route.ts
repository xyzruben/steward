// ============================================================================
// RETRY PROCESSING API ENDPOINT (NEW: Manual retry for stuck receipts)
// ============================================================================
// This endpoint allows manual retry of stuck receipt processing
// Useful for debugging and recovery from failed async processing

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { updateReceipt } from '@/lib/db'
import { extractTextFromImage, extractReceiptDataWithAI } from '@/lib/services/cloudOcr'
import { imageBufferToBase64 } from '@/lib/utils'
import { Decimal } from 'decimal.js'

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const supabase = createSupabaseServerClient(request.cookies)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🔄 Manual retry processing requested for user: ${user.id}`)

    // Find all receipts stuck in processing state
    const stuckReceipts = await prisma.receipt.findMany({
      where: {
        userId: user.id,
        merchant: 'Processing...'
      },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true
      }
    })

    if (stuckReceipts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck receipts found',
        retriedCount: 0
      })
    }

    console.log(`🔄 Found ${stuckReceipts.length} stuck receipts to retry`)

    let successCount = 0
    let errorCount = 0

    // Process each stuck receipt
    for (const receipt of stuckReceipts) {
      try {
        console.log(`🔄 Retrying processing for receipt: ${receipt.id}`)
        
        // Download the image from storage
        const imageResponse = await fetch(receipt.imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }
        
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
        
        // Run OCR
        const base64Image = imageBufferToBase64(imageBuffer, contentType)
        const ocrText = await extractTextFromImage(base64Image)
        
        // Run AI processing
        const aiData = await extractReceiptDataWithAI(ocrText)
        
        // Update receipt with processed data
        const merchant = aiData.merchant || 'Unknown Merchant'
        const total = typeof aiData.total === 'number' && !isNaN(aiData.total) ? aiData.total : 0
        const purchaseDate = aiData.purchaseDate ? new Date(aiData.purchaseDate) : new Date()
        const summary = aiData.summary || 'No summary generated'
        const receiptCurrency = aiData.currency || 'USD'
        
        await updateReceipt(receipt.id, {
          merchant,
          total: new Decimal(total),
          purchaseDate,
          summary,
          currency: receiptCurrency
        })
        
        console.log(`✅ Successfully retried processing for receipt: ${receipt.id}`)
        successCount++
        
      } catch (error) {
        console.error(`❌ Failed to retry processing for receipt ${receipt.id}:`, error)
        
        // Update with error state
        try {
          await updateReceipt(receipt.id, {
            merchant: 'Processing Failed',
            total: new Decimal(0),
            summary: 'Receipt processing failed. Please try uploading again.'
          })
        } catch (updateError) {
          console.error(`❌ Failed to update receipt ${receipt.id}:`, updateError)
        }
        
        errorCount++
      }
    }

    console.log(`✅ Manual retry completed: ${successCount} successful, ${errorCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Retry processing completed`,
      retriedCount: stuckReceipts.length,
      successCount,
      errorCount
    })

  } catch (error) {
    console.error('Error in retry processing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 