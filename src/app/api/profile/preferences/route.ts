// ============================================================================
// USER PREFERENCES API ROUTE
// ============================================================================
// Specialized API endpoints for user preferences
// See: Master System Guide - Backend/API Design, Security Requirements

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { userProfileService } from '@/lib/services/userProfile'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

// ============================================================================
// GET USER PREFERENCES
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = analyticsRateLimiter.isAllowed(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
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

    // Get preference type from query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let preferences

    switch (type) {
      case 'export':
        preferences = await userProfileService.getExportPreferences(user.id)
        break
      case 'display':
        preferences = await userProfileService.getDisplayPreferences(user.id)
        break
      case 'analytics':
        const allowsAnalytics = await userProfileService.allowsDataAnalytics(user.id)
        preferences = { allowsDataAnalytics: allowsAnalytics }
        break
      default:
        // Return all preferences
        const [exportPrefs, displayPrefs, allowsAnalyticsResult] = await Promise.all([
          userProfileService.getExportPreferences(user.id),
          userProfileService.getDisplayPreferences(user.id),
          userProfileService.allowsDataAnalytics(user.id)
        ])
        preferences = {
          export: exportPrefs,
          display: displayPrefs,
          analytics: { allowsDataAnalytics: allowsAnalyticsResult }
        }
    }

    return NextResponse.json(preferences, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })

  } catch (error) {
    console.error('Preferences GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// UPDATE USER PREFERENCES
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = analyticsRateLimiter.isAllowed(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown')
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

    // Get preference type from query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let updateData = {}

    // Map preference types to profile fields
    switch (type) {
      case 'export':
        updateData = {
          defaultExportFormat: body.format,
          includeAnalyticsByDefault: body.includeAnalytics,
          exportDateRange: body.dateRange
        }
        break
      case 'display':
        updateData = {
          theme: body.theme,
          compactMode: body.compactMode,
          dateFormat: body.dateFormat,
          timeFormat: body.timeFormat,
          currency: body.currency,
          locale: body.locale
        }
        break
      case 'analytics':
        updateData = {
          allowDataAnalytics: body.allowsDataAnalytics,
          shareUsageData: body.shareUsageData
        }
        break
      default:
        // Update all preferences
        updateData = body
    }

    // Update user profile
    const updatedProfile = await userProfileService.updateUserProfile(user.id, updateData)

    return NextResponse.json(updatedProfile, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })

  } catch (error) {
    console.error('Preferences PATCH error:', error)
    
    if (error instanceof Error && error.message?.includes('Invalid profile data')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'User profile not found') {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 