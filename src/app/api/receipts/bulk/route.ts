// ============================================================================
// BULK RECEIPTS API ROUTE
// ============================================================================
// API endpoints for bulk receipt operations
// See: Master System Guide - Backend/API Design, Security Requirements

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { bulkOperationsService } from '@/lib/services/bulkOperations'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

// ============================================================================
// GET FILTERED RECEIPTS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = analyticsRateLimiter.isAllowed(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Authentication
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
    const action = searchParams.get('action')

    switch (action) {
      case 'filter':
        return await handleFilter(request, user.id)
      case 'stats':
        return await handleStats(request, user.id)
      case 'options':
        return await handleOptions(user.id)
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bulk receipts GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// BULK OPERATIONS (POST)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = analyticsRateLimiter.isAllowed(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Authentication
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
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    const { action, ...data } = body

    switch (action) {
      case 'update':
        return await handleBulkUpdate(user.id, data)
      case 'delete':
        return await handleBulkDelete(user.id, data)
      case 'export':
        return await handleBulkExport(user.id, data)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bulk receipts POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleFilter(request: NextRequest, userId: string) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters from query parameters
    const filters: any = {}
    
    // Date range
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate || endDate) {
      filters.dateRange = {}
      if (startDate) filters.dateRange.start = new Date(startDate)
      if (endDate) filters.dateRange.end = new Date(endDate)
    }

    // Amount range
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    if (minAmount || maxAmount) {
      filters.amountRange = {}
      if (minAmount) filters.amountRange.min = parseFloat(minAmount)
      if (maxAmount) filters.amountRange.max = parseFloat(maxAmount)
    }

    // Categories
    const categories = searchParams.get('categories')
    if (categories) {
      filters.categories = categories.split(',').map(c => c.trim())
    }

    // Merchants
    const merchants = searchParams.get('merchants')
    if (merchants) {
      filters.merchants = merchants.split(',').map(m => m.trim())
    }

    // Confidence score
    const minConfidence = searchParams.get('minConfidence')
    const maxConfidence = searchParams.get('maxConfidence')
    if (minConfidence || maxConfidence) {
      filters.confidenceScore = {}
      if (minConfidence) filters.confidenceScore.min = parseFloat(minConfidence)
      if (maxConfidence) filters.confidenceScore.max = parseFloat(maxConfidence)
    }

    // Has summary
    const hasSummary = searchParams.get('hasSummary')
    if (hasSummary !== null) {
      filters.hasSummary = hasSummary === 'true'
    }

    // Search query
    const searchQuery = searchParams.get('searchQuery')
    if (searchQuery) {
      filters.searchQuery = searchQuery
    }

    const result = await bulkOperationsService.filterReceipts(userId, filters)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Filter error:', error)
    return NextResponse.json(
      { error: 'Failed to filter receipts' },
      { status: 500 }
    )
  }
}

async function handleStats(request: NextRequest, userId: string) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters from query parameters (same as filter)
    const filters: any = {}
    
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate || endDate) {
      filters.dateRange = {}
      if (startDate) filters.dateRange.start = new Date(startDate)
      if (endDate) filters.dateRange.end = new Date(endDate)
    }

    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    if (minAmount || maxAmount) {
      filters.amountRange = {}
      if (minAmount) filters.amountRange.min = parseFloat(minAmount)
      if (maxAmount) filters.amountRange.max = parseFloat(maxAmount)
    }

    const categories = searchParams.get('categories')
    if (categories) {
      filters.categories = categories.split(',').map(c => c.trim())
    }

    const merchants = searchParams.get('merchants')
    if (merchants) {
      filters.merchants = merchants.split(',').map(m => m.trim())
    }

    const result = await bulkOperationsService.getReceiptStats(userId, filters)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get receipt statistics' },
      { status: 500 }
    )
  }
}

async function handleOptions(userId: string) {
  try {
    const result = await bulkOperationsService.getFilterOptions(userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Options error:', error)
    return NextResponse.json(
      { error: 'Failed to get filter options' },
      { status: 500 }
    )
  }
}

async function handleBulkUpdate(userId: string, data: any) {
  try {
    const { receiptIds, updates } = data

    if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json(
        { error: 'receiptIds array is required' },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'updates object is required' },
        { status: 400 }
      )
    }

    const result = await bulkOperationsService.bulkUpdate(userId, receiptIds, updates)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk update' },
      { status: 500 }
    )
  }
}

async function handleBulkDelete(userId: string, data: any) {
  try {
    const { receiptIds } = data

    if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json(
        { error: 'receiptIds array is required' },
        { status: 400 }
      )
    }

    const result = await bulkOperationsService.bulkDelete(userId, receiptIds)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk delete' },
      { status: 500 }
    )
  }
}

async function handleBulkExport(userId: string, data: any) {
  try {
    const { receiptIds, format = 'csv', includeAnalytics = false } = data

    if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json(
        { error: 'receiptIds array is required' },
        { status: 400 }
      )
    }

    const result = await bulkOperationsService.prepareBulkExport(userId, receiptIds)

    // TODO: Integrate with export service for actual file generation
    // For now, return the prepared data
    return NextResponse.json({
      ...result,
      format,
      includeAnalytics,
      exportUrl: null // Would be generated by export service
    })

  } catch (error) {
    console.error('Bulk export error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare bulk export' },
      { status: 500 }
    )
  }
} 