// ============================================================================
// SEMANTIC SEARCH API ROUTE
// ============================================================================
// AI-powered semantic search using vector embeddings
// See: Master System Guide - API Route Principles, Authentication and Authorization

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { EmbeddingsService } from '@/lib/services/embeddings'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
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

    // Rate limiting
    const rateLimitKey = `semantic_search:${user.id}`
    const rateLimit = analyticsRateLimiter.isAllowed(rateLimitKey)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Build search parameters
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const threshold = searchParams.get('threshold') ? parseFloat(searchParams.get('threshold')!) : 0.7
    
    // Parse filters
    const filters: any = {}
    
    const category = searchParams.get('category')
    if (category) filters.category = category
    
    const merchant = searchParams.get('merchant')
    if (merchant) filters.merchant = merchant
    
    const minAmount = searchParams.get('minAmount')
    if (minAmount) filters.minAmount = parseFloat(minAmount)
    
    const maxAmount = searchParams.get('maxAmount')
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount)
    
    const startDate = searchParams.get('startDate')
    if (startDate) filters.startDate = new Date(startDate)
    
    const endDate = searchParams.get('endDate')
    if (endDate) filters.endDate = new Date(endDate)

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }
    
    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Threshold must be between 0 and 1' },
        { status: 400 }
      )
    }

    // Perform semantic search
    const embeddingsService = new EmbeddingsService()
    const results = await embeddingsService.semanticSearch({
      query: query.trim(),
      userId: user.id,
      limit,
      threshold,
      filters
    })

    // Add rate limit headers to response
    const response = NextResponse.json({
      results,
      query: query.trim(),
      count: results.length,
      metadata: {
        timestamp: new Date().toISOString(),
        threshold,
        limit
      }
    })
    
    response.headers.set('X-RateLimit-Limit', '50')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

    return response

  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: 'Semantic search failed' },
      { status: 500 }
    )
  }
}

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

    // Rate limiting
    const rateLimitKey = `semantic_insights:${user.id}`
    const rateLimit = analyticsRateLimiter.isAllowed(rateLimitKey)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { query } = body
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Generate spending insights
    const embeddingsService = new EmbeddingsService()
    const insights = await embeddingsService.generateSpendingInsights(user.id, query.trim())

    // Add rate limit headers to response
    const response = NextResponse.json({
      insights,
      query: query.trim(),
      metadata: {
        timestamp: new Date().toISOString(),
        generatedAt: new Date().toISOString()
      }
    })
    
    response.headers.set('X-RateLimit-Limit', '20')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

    return response

  } catch (error) {
    console.error('Spending insights error:', error)
    return NextResponse.json(
      { error: 'Failed to generate spending insights' },
      { status: 500 }
    )
  }
} 