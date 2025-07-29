// ============================================================================
// EMBEDDINGS GENERATION API ROUTE
// ============================================================================
// Generate embeddings for existing receipts
// See: Master System Guide - API Route Principles, Authentication and Authorization

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
// EmbeddingsService removed for performance optimization

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

    // Embeddings functionality removed for performance optimization
    return NextResponse.json({
      success: false,
      message: 'Embeddings feature has been disabled for performance optimization',
      metadata: {
        timestamp: new Date().toISOString()
      }
    }, { status: 501 })

  } catch (error) {
    console.error('Embedding generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate embeddings' },
      { status: 500 }
    )
  }
} 