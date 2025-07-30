// ============================================================================
// DASHBOARD DATA API ROUTE - Simplified for AI-First Architecture
// ============================================================================
// Basic dashboard data endpoint without complex analytics overhead

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getReceiptsByUserId } from '@/lib/db'

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
    
    // DEBUG: Log what we're getting from the database
    console.log('🔍 DASHBOARD DEBUG:', {
      userId: user.id,
      receiptsCount: receipts.length,
      receipts: receipts.map(r => ({
        id: r.id,
        merchant: r.merchant,
        total: r.total,
        purchaseDate: r.purchaseDate,
        createdAt: r.createdAt
      }))
    })
    
    // Calculate basic stats
    const totalSpent = receipts.reduce((sum, receipt) => sum + Number(receipt.total || 0), 0)
    const totalReceipts = receipts.length
    const averagePerReceipt = totalReceipts > 0 ? totalSpent / totalReceipts : 0
    
    // Transform receipts to match expected format
    const recentReceipts = receipts.slice(0, 5).map(receipt => ({
      id: receipt.id,
      merchant: receipt.merchant || 'Unknown Merchant',
      amount: Number(receipt.total || 0),
      date: receipt.purchaseDate ? new Date(receipt.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      category: (receipt as any).category || 'Uncategorized',
      imageUrl: receipt.imageUrl || undefined
    }))
    
    // DEBUG: Log what we're sending to the UI
    console.log('🔍 DASHBOARD RESPONSE:', {
      totalReceipts,
      recentReceiptsCount: recentReceipts.length,
      recentReceipts: recentReceipts.map(r => ({
        id: r.id,
        merchant: r.merchant,
        amount: r.amount
      }))
    })
    
    const dashboardData = {
      stats: {
        totalSpent,
        totalReceipts,
        averagePerReceipt,
        monthlyGrowth: 0 // Placeholder - can be calculated later
      },
      recentReceipts,
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