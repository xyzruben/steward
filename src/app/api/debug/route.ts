import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Check storage buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    return NextResponse.json({
      auth: {
        user: user ? { id: user.id, email: user.email } : null,
        error: authError?.message
      },
      storage: {
        buckets: buckets?.map(b => b.name) || [],
        error: bucketError?.message
      },
      env: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
} 