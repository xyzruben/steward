import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createUser, getUserById } from '@/lib/db'

// ============================================================================
// SYNC USER API ROUTE
// ============================================================================
// Syncs Supabase Auth users with our Prisma database
// Uses service role key for server-side operations

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the user exists in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: 'User not found in Supabase Auth' },
        { status: 404 }
      )
    }

    // Check if user already exists in our database
    const existingUser = await getUserById(userId)
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists', user: existingUser },
        { status: 200 }
      )
    }

    // Create new user in our database
    const newUser = await createUser({
      id: userId,
      email: email,
      name: authUser.user.user_metadata?.full_name || null,
      avatarUrl: authUser.user.user_metadata?.avatar_url || null,
    })

    return NextResponse.json(
      { message: 'User synced successfully', user: newUser },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 