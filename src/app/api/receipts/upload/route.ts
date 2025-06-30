import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getOCRService } from '@/lib/services/ocr'
import { createReceipt } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('receipt') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${user.id}/${timestamp}.${fileExtension}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)

    // Process OCR
    let ocrResult = null
    let extractedText = ''
    let ocrConfidence = 0

    try {
      const ocrService = getOCRService()
      ocrResult = await ocrService.extractText(publicUrl)
      
      extractedText = ocrService.cleanText(ocrResult.text)
      ocrConfidence = ocrResult.confidence

      console.log('OCR Result:', {
        text: extractedText.substring(0, 100) + '...',
        confidence: ocrConfidence,
        processingTime: ocrResult.processingTime
      })
    } catch (ocrError) {
      console.error('OCR processing failed:', ocrError)
      // Continue without OCR - we'll store the receipt with empty text
    }

    // Extract basic receipt data (placeholder - will be enhanced with AI later)
    const merchant = extractMerchantFromText(extractedText)
    const total = extractTotalFromText(extractedText)
    const purchaseDate = new Date() // Default to current date

    // Create receipt record in database
    const receipt = await createReceipt({
      userId: user.id,
      imageUrl: publicUrl,
      rawText: extractedText,
      merchant: merchant || 'Unknown Merchant',
      total: total || 0,
      purchaseDate: purchaseDate,
      summary: ocrResult ? `OCR Confidence: ${ocrConfidence.toFixed(1)}%` : 'OCR processing failed'
    })

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        imageUrl: publicUrl,
        merchant: receipt.merchant,
        total: receipt.total,
        purchaseDate: receipt.purchaseDate,
        ocrConfidence: ocrConfidence
      }
    })

  } catch (error) {
    console.error('Error uploading receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractMerchantFromText(text: string): string | null {
  // Simple merchant extraction - will be enhanced with AI later
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  // Look for common merchant patterns
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    const cleanLine = line.trim()
    if (cleanLine.length > 3 && cleanLine.length < 50) {
      // Skip lines that look like prices or dates
      if (!/^\$?\d+\.?\d*$/.test(cleanLine) && !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cleanLine)) {
        return cleanLine
      }
    }
  }
  
  return null
}

function extractTotalFromText(text: string): number | null {
  // Simple total extraction - will be enhanced with AI later
  const totalPatterns = [
    /total.*?\$?(\d+\.?\d*)/i,
    /amount.*?\$?(\d+\.?\d*)/i,
    /sum.*?\$?(\d+\.?\d*)/i,
    /\$(\d+\.?\d*)/g
  ]
  
  for (const pattern of totalPatterns) {
    const matches = text.match(pattern)
    if (matches && matches[1]) {
      const amount = parseFloat(matches[1])
      if (!isNaN(amount) && amount > 0) {
        return amount
      }
    }
  }
  
  return null
} 