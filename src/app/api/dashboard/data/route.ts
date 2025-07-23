// ============================================================================
// DASHBOARD DATA API ROUTE (see STEWARD_MASTER_SYSTEM_GUIDE.md - API Route Principles)
// ============================================================================
// Batch API endpoint for fetching all dashboard data in a single call
// Follows master guide: API Route Principles, Authentication and Authorization, Performance

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { AnalyticsService } from '@/lib/services/analytics'
import { getReceiptsByUserId } from '@/lib/db'
import { analyticsRateLimiter } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    // Authentication check (see master guide: Authentication and Authorization)
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting (see master guide: Rate Limiting and Validation)
    const rateLimitKey = `dashboard:${user.id}`
    const rateLimit = analyticsRateLimiter.isAllowed(rateLimitKey)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    const startTime = Date.now()

    // Fetch all dashboard data in parallel
    const analyticsService = new AnalyticsService()
    const [analyticsData, recentReceipts] = await Promise.all([
      // Get analytics overview
      analyticsService.getOverview(user.id),
      // Get recent receipts
      getReceiptsByUserId(user.id, { take: 5, orderBy: 'purchaseDate', order: 'desc' })
    ])

    // Transform data to match expected format
    const dashboardData = {
      stats: {
        totalSpent: analyticsData.data.totalSpent,
        totalReceipts: analyticsData.data.receiptCount,
        averagePerReceipt: analyticsData.data.averageReceipt,
        monthlyGrowth: 12.5 // Mock data for now
      },
      recentReceipts: recentReceipts.map((receipt: any) => ({
        id: receipt.id,
        merchant: receipt.merchant,
        amount: Number(receipt.total),
        date: receipt.purchaseDate.toISOString().split('T')[0],
        category: receipt.category || 'Uncategorized',
        imageUrl: receipt.imageUrl
      })),
      analytics: {
        totalSpent: analyticsData.data.totalSpent,
        totalReceipts: analyticsData.data.receiptCount,
        averagePerReceipt: analyticsData.data.averageReceipt,
        monthlyGrowth: 12.5, // Mock data for now
        topCategory: 'Food & Dining', // Mock data for now
        topMerchant: 'Amazon.com' // Mock data for now
      }
    }

    const queryTime = Date.now() - startTime

    // Add rate limit headers to response
    const response = NextResponse.json({
      ...dashboardData,
      metadata: {
        queryTime,
        cached: false,
        timestamp: new Date().toISOString(),
        userId: user.id
      }
    })
    
    response.headers.set('X-RateLimit-Limit', '30')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

    return response

  } catch (error) {
    console.error('Dashboard data API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 