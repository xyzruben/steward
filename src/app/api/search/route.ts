// ============================================================================
// ENHANCED SEARCH API ROUTE
// ============================================================================
// Advanced search endpoint with fuzzy matching, suggestions, and analytics
// See: Master System Guide - API Route Principles, Authentication and Authorization

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { SearchService, type SearchQuery } from '@/lib/services/search'


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



    // Parse query parameters
    const { searchParams } = new URL(request.url)
    
    // Build search query
    const searchQuery: SearchQuery = {
      query: searchParams.get('q') || '',
      filters: {
        category: searchParams.get('category') || undefined,
        merchant: searchParams.get('merchant') || undefined,
        startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
        endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      },
      options: {
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
        sortBy: searchParams.get('sortBy') as 'date' | 'amount' | 'merchant' || 'date',
        sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
      }
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

    // Return search results
    return NextResponse.json(result)
  } catch (error) {
    // Secure error handling (see master guide: Secure Error Handling)
    console.error('Enhanced search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

