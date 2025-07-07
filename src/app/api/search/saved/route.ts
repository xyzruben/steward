// ============================================================================
// SAVED SEARCHES API ROUTE
// ============================================================================
// Manage user's saved search queries and filters
// See: Master System Guide - API Route Principles, Authentication and Authorization

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { SearchService } from '@/lib/services/search'

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

    // Get saved searches for user
    const searchService = new SearchService()
    const savedSearches = await searchService.getSavedSearches(user.id)

    return NextResponse.json(savedSearches)
  } catch (error) {
    console.error('Get saved searches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Parse request body
    const body = await request.json()
    const { name, query, filters } = body

    if (!name || !query) {
      return NextResponse.json(
        { error: 'Name and query are required' },
        { status: 400 }
      )
    }

    // Save search
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

export async function DELETE(request: NextRequest) {
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

    // Parse search ID from query params
    const { searchParams } = new URL(request.url)
    const searchId = searchParams.get('id')

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      )
    }

    // Delete saved search
    const searchService = new SearchService()
    await searchService.deleteSavedSearch(user.id, searchId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete saved search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 