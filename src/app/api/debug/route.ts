import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at ? true : false
      } : null,
      authError: authError?.message || null,
      cookies: Object.fromEntries(
        Array.from(cookieStore.getAll()).map(cookie => [cookie.name, cookie.value])
      )
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      authenticated: false
    })
  }
} 