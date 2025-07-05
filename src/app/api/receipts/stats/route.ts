import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getReceiptStats } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get receipt statistics for the user
    const stats = await getReceiptStats(user.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching receipt stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 