// ============================================================================
// NOTIFICATION PREFERENCES API ROUTE (see STEWARD_MASTER_SYSTEM_GUIDE.md - API Route Principles)
// ============================================================================
// Notification preferences management endpoint
// Follows master guide: Security Considerations, Input Validation, Error Handling

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { notificationService, type NotificationPreferences } from '@/lib/services/notifications'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

// ============================================================================
// DEFAULT PREFERENCES (see master guide: Error Handling)
// ============================================================================

const getDefaultPreferences = (userId: string): NotificationPreferences => ({
  userId,
  emailNotifications: true,
  pushNotifications: true,
  receiptUploads: true,
  receiptProcessing: true,
  analyticsUpdates: true,
  searchSuggestions: true,
  systemAlerts: true,
  exportNotifications: true,
  backupNotifications: true,
})

// ============================================================================
// GET PREFERENCES (see master guide: API Route Principles)
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

    // Try to get preferences from database
    try {
      const preferences = await notificationService.getPreferences(user.id)
      return NextResponse.json({
        success: true,
        data: preferences,
        metadata: {
          timestamp: new Date().toISOString(),
        }
      })
    } catch (dbError) {
      console.warn('Notification Preferences API: Database error, returning defaults:', dbError)
      
      // Return default preferences if database is unavailable
      const defaultPreferences = getDefaultPreferences(user.id)
      return NextResponse.json({
        success: true,
        data: defaultPreferences,
        metadata: {
          timestamp: new Date().toISOString(),
          note: 'Using default preferences due to database unavailability'
        }
      })
    }

  } catch (error) {
    console.error('Notification Preferences API: GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// UPDATE PREFERENCES (see master guide: API Route Principles)
// ============================================================================

export async function PUT(request: NextRequest) {
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
    const {
      emailNotifications,
      pushNotifications,
      receiptUploads,
      receiptProcessing,
      analyticsUpdates,
      searchSuggestions,
      systemAlerts,
      exportNotifications,
      backupNotifications,
    } = body

    // Validate preferences object
    const preferences: Partial<NotificationPreferences> = {}

    if (typeof emailNotifications === 'boolean') {
      preferences.emailNotifications = emailNotifications
    }
    if (typeof pushNotifications === 'boolean') {
      preferences.pushNotifications = pushNotifications
    }
    if (typeof receiptUploads === 'boolean') {
      preferences.receiptUploads = receiptUploads
    }
    if (typeof receiptProcessing === 'boolean') {
      preferences.receiptProcessing = receiptProcessing
    }
    if (typeof analyticsUpdates === 'boolean') {
      preferences.analyticsUpdates = analyticsUpdates
    }
    if (typeof searchSuggestions === 'boolean') {
      preferences.searchSuggestions = searchSuggestions
    }
    if (typeof systemAlerts === 'boolean') {
      preferences.systemAlerts = systemAlerts
    }
    if (typeof exportNotifications === 'boolean') {
      preferences.exportNotifications = exportNotifications
    }
    if (typeof backupNotifications === 'boolean') {
      preferences.backupNotifications = backupNotifications
    }

    // Try to update preferences in database
    try {
      const updatedPreferences = await notificationService.updatePreferences(user.id, preferences)
      return NextResponse.json({
        success: true,
        data: updatedPreferences,
        metadata: {
          timestamp: new Date().toISOString(),
        }
      })
    } catch (dbError) {
      console.warn('Notification Preferences API: Database error during update:', dbError)
      
      // Return merged preferences if database is unavailable
      const defaultPreferences = getDefaultPreferences(user.id)
      const mergedPreferences = { ...defaultPreferences, ...preferences }
      
      return NextResponse.json({
        success: true,
        data: mergedPreferences,
        metadata: {
          timestamp: new Date().toISOString(),
          note: 'Preferences merged with defaults due to database unavailability'
        }
      })
    }

  } catch (error) {
    console.error('Notification Preferences API: PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 