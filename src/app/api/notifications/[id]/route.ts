// ============================================================================
// NOTIFICATION ACTIONS API ROUTE (see STEWARD_MASTER_SYSTEM_GUIDE.md - API Route Principles)
// ============================================================================
// Individual notification operations (mark as read, delete)
// Follows master guide: Security Considerations, Input Validation, Error Handling

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { notificationService } from '@/lib/services/notifications'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

// ============================================================================
// MARK AS READ (see master guide: API Route Principles)
// ============================================================================

export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Validate notification ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      )
    }

    // Mark notification as read
    await notificationService.markAsRead(id, user.id)

    return NextResponse.json({
      success: true,
      data: { id, isRead: true },
      metadata: {
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Notification Actions API: PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE NOTIFICATION (see master guide: API Route Principles)
// ============================================================================

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Validate notification ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      )
    }

    // Delete notification
    await notificationService.deleteNotification(id, user.id)

    return NextResponse.json({
      success: true,
      data: { id, deleted: true },
      metadata: {
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Notification Actions API: DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 