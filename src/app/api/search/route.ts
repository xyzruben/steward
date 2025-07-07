// ============================================================================
// ENHANCED SEARCH API ROUTE
// ============================================================================
// Advanced search endpoint with fuzzy matching, suggestions, and analytics
// See: Master System Guide - API Route Principles, Authentication and Authorization

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { SearchService, type SearchQuery } from '@/lib/services/search'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    // Authentication check (see master guide: Authentication and Authorization)
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting (see master guide: Rate Limiting and Validation)
    const rateLimitKey = `search:${user.id}`
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
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    // Build search query
    const searchQuery: SearchQuery = {
      query: searchParams.get('q') || '',
      filters: {
        category: searchParams.get('category') || undefined,
        subcategory: searchParams.get('subcategory') || undefined,
        merchant: searchParams.get('merchant') || undefined,
        minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
        maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
        minConfidence: searchParams.get('minConfidence') ? parseFloat(searchParams.get('minConfidence')!) : undefined,
      },
      options: {
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
        sortBy: searchParams.get('sortBy') as 'relevance' | 'date' | 'amount' | 'merchant' || 'relevance',
        sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
        includeSuggestions: searchParams.get('suggestions') === 'true',
        fuzzyMatch: searchParams.get('fuzzy') === 'true',
      }
    }

    // Validate numeric parameters
    if (searchQuery.filters?.minAmount !== undefined && isNaN(searchQuery.filters.minAmount)) {
      return NextResponse.json(
        { error: 'Invalid minAmount parameter' },
        { status: 400 }
      )
    }
    
    if (searchQuery.filters?.maxAmount !== undefined && isNaN(searchQuery.filters.maxAmount)) {
      return NextResponse.json(
        { error: 'Invalid maxAmount parameter' },
        { status: 400 }
      )
    }
    
    if (searchQuery.filters?.minConfidence !== undefined && (isNaN(searchQuery.filters.minConfidence) || searchQuery.filters.minConfidence < 0 || searchQuery.filters.minConfidence > 1)) {
      return NextResponse.json(
        { error: 'Invalid minConfidence parameter (must be between 0 and 1)' },
        { status: 400 }
      )
    }

    // Validate date parameters
    if (searchQuery.filters?.startDate && isNaN(searchQuery.filters.startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate parameter' },
        { status: 400 }
      )
    }
    
    if (searchQuery.filters?.endDate && isNaN(searchQuery.filters.endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid endDate parameter' },
        { status: 400 }
      )
    }

    // Validate amount range
    if (searchQuery.filters?.minAmount !== undefined && searchQuery.filters?.maxAmount !== undefined && searchQuery.filters.minAmount > searchQuery.filters.maxAmount) {
      return NextResponse.json(
        { error: 'minAmount cannot be greater than maxAmount' },
        { status: 400 }
      )
    }

    // Validate date range
    if (searchQuery.filters?.startDate && searchQuery.filters?.endDate && searchQuery.filters.startDate > searchQuery.filters.endDate) {
      return NextResponse.json(
        { error: 'startDate cannot be after endDate' },
        { status: 400 }
      )
    }

    // Perform search using SearchService
    const searchService = new SearchService()
    const result = await searchService.search(user.id, searchQuery)

    // Add rate limit headers to response
    const response = NextResponse.json(result)
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

    return response
  } catch (error) {
    // Secure error handling (see master guide: Secure Error Handling)
    console.error('Enhanced search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// SAVED SEARCHES ENDPOINTS
// ============================================================================

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
    const { name, query, filters } = body

    if (!name || !query) {
      return NextResponse.json(
        { error: 'Name and query are required' },
        { status: 400 }
      )
    }

    // Save search using SearchService
    const searchService = new SearchService()
    const savedSearch = await searchService.saveSearch(user.id, name, query, filters || {})

    return NextResponse.json(savedSearch)
  } catch (error) {
    console.error('Save search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 