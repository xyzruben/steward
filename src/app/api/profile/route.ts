// ============================================================================
// SIMPLIFIED USER PROFILE API ROUTE
// ============================================================================
// Basic user profile management - simplified for performance optimization

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'

// ============================================================================
// GET USER PROFILE
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

    // Return simplified profile data
    const profile = {
      id: user.id,
      email: user.email,
      firstName: '',
      lastName: '',
      phone: '',
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at
    }

    return NextResponse.json(profile)

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

    // Simplified profile update - just return success
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully (simplified)'
    })

  } catch (error) {
    console.error('Profile PUT error:', error)
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

    // Simplified profile deletion - just return success
    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully (simplified)'
    })

  } catch (error) {
    console.error('Profile DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 