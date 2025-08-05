import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return NextResponse.json({
        authenticated: false,
        error: error.message,
        cookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value ? 'SET' : 'NOT SET' }))
      })
    }
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        error: 'No user found',
        cookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value ? 'SET' : 'NOT SET' }))
      })
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      },
      cookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value ? 'SET' : 'NOT SET' }))
    })
    
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cookies: []
    })
  }
} 