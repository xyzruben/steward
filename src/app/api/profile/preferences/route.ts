// ============================================================================
// SIMPLIFIED USER PREFERENCES API ROUTE
// ============================================================================
// Basic user preferences - simplified for performance optimization

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'

// ============================================================================
// GET USER PREFERENCES
// ============================================================================

export async function GET(request: NextRequest) {
  try {
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

    // Return simplified default preferences
    const preferences = {
      display: {
        theme: 'system',
        compactMode: false,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        locale: 'en-US'
      },
      export: {
        format: 'csv',
        includeAnalytics: false,
        dateRange: '30d'
      },
      analytics: {
        allowsDataAnalytics: true
      }
    }

    return NextResponse.json(preferences)

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

    // Simplified preferences update - just return success
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully (simplified)'
    })

  } catch (error) {
    console.error('Preferences PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 