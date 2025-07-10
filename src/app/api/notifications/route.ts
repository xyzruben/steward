// ============================================================================
// NOTIFICATIONS API ROUTE (see STEWARD_MASTER_SYSTEM_GUIDE.md - API Route Principles)
// ============================================================================
// Main notifications API endpoint for CRUD operations
// Follows master guide: Security Considerations, Input Validation, Error Handling

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { notificationService, type NotificationFilters } from '@/lib/services/notifications'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

// ============================================================================
// GET NOTIFICATIONS (see master guide: API Route Principles)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = analyticsRateLimiter.isAllowed(clientIp)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get user from session
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
    const type = searchParams.get('type') as any
    const isRead = searchParams.get('isRead')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filters
    const filters: NotificationFilters = {
      limit: Math.min(limit, 100), // Cap at 100
      offset: Math.max(offset, 0),
    }

    if (type) {
      filters.type = type
    }

    if (isRead !== null) {
      filters.isRead = isRead === 'true'
    }

    if (startDate) {
      filters.startDate = new Date(startDate)
    }

    if (endDate) {
      filters.endDate = new Date(endDate)
    }

    // Try to get notifications from database
    try {
      const notifications = await notificationService.getNotifications(user.id, filters)

      return NextResponse.json({
        success: true,
        data: notifications,
        metadata: {
          count: notifications.length,
          filters,
          timestamp: new Date().toISOString(),
        }
      })
    } catch (dbError) {
      console.warn('Notifications API: Database error, returning empty array:', dbError)
      
      // Return empty array if database is unavailable
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          count: 0,
          filters,
          timestamp: new Date().toISOString(),
          note: 'Using empty array due to database unavailability'
        }
      }, {
        headers: {
          'X-Database-Status': 'unavailable'
        }
      })
    }

  } catch (error) {
    console.error('Notifications API: GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// CREATE NOTIFICATION (see master guide: API Route Principles)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = analyticsRateLimiter.isAllowed(clientIp)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get user from session
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
    const { type, title, message, metadata } = body

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      )
    }

    // Try to create notification in database
    try {
      const notification = await notificationService.createNotification({
        userId: user.id,
        type,
        title,
        message,
        metadata,
      })

      return NextResponse.json({
        success: true,
        data: notification,
        metadata: {
          timestamp: new Date().toISOString(),
        }
      }, { status: 201 })
    } catch (dbError) {
      console.warn('Notifications API: Database error during creation:', dbError)
      
      // Return a mock notification if database is unavailable
      const mockNotification = {
        id: `mock-${Date.now()}`,
        userId: user.id,
        type,
        title,
        message,
        metadata: metadata || {},
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      return NextResponse.json({
        success: true,
        data: mockNotification,
        metadata: {
          timestamp: new Date().toISOString(),
          note: 'Created mock notification due to database unavailability'
        }
      }, { 
        status: 201,
        headers: {
          'X-Database-Status': 'unavailable'
        }
      })
    }

  } catch (error) {
    console.error('Notifications API: POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 