// ============================================================================
// EMBEDDINGS GENERATION API ROUTE
// ============================================================================
// Generate embeddings for existing receipts
// See: Master System Guide - API Route Principles, Authentication and Authorization

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { EmbeddingsService } from '@/lib/services/embeddings'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { receiptId, regenerate = false } = body

    const embeddingsService = new EmbeddingsService()

    if (receiptId) {
      // Generate embedding for specific receipt
      await embeddingsService.updateEmbeddingForReceipt(receiptId)
      
      return NextResponse.json({
        success: true,
        message: 'Embedding generated successfully',
        receiptId,
        metadata: {
          timestamp: new Date().toISOString()
        }
      })
    } else {
      // Generate embeddings for all user's receipts
      await embeddingsService.generateEmbeddingsForUser(user.id)
      
      return NextResponse.json({
        success: true,
        message: 'Embeddings generated successfully for all receipts',
        metadata: {
          timestamp: new Date().toISOString(),
          userId: user.id
        }
      })
    }

  } catch (error) {
    console.error('Embedding generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    )
  }
} 