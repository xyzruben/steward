// ============================================================================
// DASHBOARD DATA API ROUTE - Simplified for AI-First Architecture
// ============================================================================
// Basic dashboard data endpoint without complex analytics overhead

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getReceiptsByUserId } from '@/lib/db'
import { dbService } from '@/lib/services/db'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch basic dashboard data
    const receipts = await getReceiptsByUserId(user.id, { take: 10 })
    
    // Calculate basic stats
    const totalSpent = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0)
    const receiptCount = receipts.length
    
    const dashboardData = {
      receipts: receipts.slice(0, 5), // Recent receipts
      stats: {
        totalSpent,
        receiptCount,
        averageSpent: receiptCount > 0 ? totalSpent / receiptCount : 0
      },
      metadata: {
        timestamp: new Date().toISOString(),
        userId: user.id
      }
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 