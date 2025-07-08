// ============================================================================
// DATA EXPORT API ROUTE
// ============================================================================
// Secure export endpoint for receipts and analytics data
// See: Master System Guide - API Route Principles, Security Requirements

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { exportService, type ExportOptions } from '@/lib/services/export'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
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
    const rateLimitKey = `export:${user.id}`
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
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    // Parse request body
    const body = await request.json()
    const { format, includeAnalytics, dateRange, categories, merchants, minAmount, maxAmount } = body

    // Validate required fields
    if (!format || !['csv', 'json', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv, json, or pdf' },
        { status: 400 }
      )
    }

    // Validate date range if provided
    if (dateRange) {
      if (dateRange.start && isNaN(new Date(dateRange.start).getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date' },
          { status: 400 }
        )
      }
      if (dateRange.end && isNaN(new Date(dateRange.end).getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date' },
          { status: 400 }
        )
      }
      if (dateRange.start && dateRange.end && new Date(dateRange.start) > new Date(dateRange.end)) {
        return NextResponse.json(
          { error: 'Start date cannot be after end date' },
          { status: 400 }
        )
      }
    }

    // Validate amount range if provided
    if (minAmount !== undefined && (isNaN(minAmount) || minAmount < 0)) {
      return NextResponse.json(
        { error: 'Invalid minAmount parameter' },
        { status: 400 }
      )
    }
    if (maxAmount !== undefined && (isNaN(maxAmount) || maxAmount < 0)) {
      return NextResponse.json(
        { error: 'Invalid maxAmount parameter' },
        { status: 400 }
      )
    }
    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
      return NextResponse.json(
        { error: 'minAmount cannot be greater than maxAmount' },
        { status: 400 }
      )
    }

    // Build export options
    const exportOptions: ExportOptions = {
      format,
      includeAnalytics: includeAnalytics || false,
      dateRange: dateRange ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      } : undefined,
      categories: categories || undefined,
      merchants: merchants || undefined,
      minAmount: minAmount || undefined,
      maxAmount: maxAmount || undefined
    }

    // Perform export
    const result = await exportService.exportData(user.id, exportOptions)

    // Create response with file download
    const response = new NextResponse(result.data)
    
    // Set appropriate headers for file download
    response.headers.set('Content-Type', result.contentType)
    response.headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)
    response.headers.set('Content-Length', result.size.toString())
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '10')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

    return response
  } catch (error) {
    // Secure error handling (see master guide: Secure Error Handling)
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET METHOD FOR EXPORT OPTIONS
// ============================================================================

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

    // Return available export options and formats
    const exportOptions = {
      formats: [
        { value: 'csv', label: 'CSV (Excel compatible)', description: 'Comma-separated values for spreadsheet applications' },
        { value: 'json', label: 'JSON', description: 'Structured data format for developers and integrations' },
        { value: 'pdf', label: 'PDF', description: 'Portable document format for printing and sharing' }
      ],
      features: {
        includeAnalytics: true,
        dateRange: true,
        categories: true,
        merchants: true,
        amountRange: true
      },
      limits: {
        maxRecords: 10000,
        maxDateRange: 365, // days
        rateLimit: {
          requests: 10,
          window: 3600 // 1 hour
        }
      }
    }

    return NextResponse.json(exportOptions)
  } catch (error) {
    console.error('Export options error:', error)
    return NextResponse.json(
      { error: 'Failed to get export options' },
      { status: 500 }
    )
  }
} 