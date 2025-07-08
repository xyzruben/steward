// ============================================================================
// USER PROFILE API ROUTE
// ============================================================================
// API endpoints for user profile management
// See: Master System Guide - Backend/API Design, Security Requirements

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { userProfileService } from '@/lib/services/userProfile'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

// ============================================================================
// GET USER PROFILE
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
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const profile = await userProfileService.getUserProfile(user.id)

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })

  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// UPDATE USER PROFILE
// ============================================================================

export async function PUT(request: NextRequest) {
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
    const supabase = createSupabaseServerClient()
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

    // Update user profile
    const updatedProfile = await userProfileService.upsertUserProfile(user.id, body)

    return NextResponse.json(updatedProfile, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    })

  } catch (error) {
    console.error('Profile PUT error:', error)
    
    if (error instanceof Error && error.message?.includes('Invalid profile data')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE USER PROFILE
// ============================================================================

export async function DELETE(request: NextRequest) {
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
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete user profile
    await userProfileService.deleteUserProfile(user.id)

    return NextResponse.json(
      { message: 'Profile deleted successfully' },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    )

  } catch (error) {
    console.error('Profile DELETE error:', error)
    
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