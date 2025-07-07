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

    // Get notifications
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

    // Create notification
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

  } catch (error) {
    console.error('Notifications API: POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 