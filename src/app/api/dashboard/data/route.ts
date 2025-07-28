// ============================================================================
// DASHBOARD DATA API ROUTE (see STEWARD_MASTER_SYSTEM_GUIDE.md - API Route Principles)
// ============================================================================
// Enhanced batch API endpoint with intelligent caching and performance optimization
// Follows master guide: API Route Principles, Authentication and Authorization, Performance

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { AnalyticsService } from '@/lib/services/analytics'
import { getReceiptsByUserId } from '@/lib/db'
import { analyticsRateLimiter } from '@/lib/rate-limiter'
import { analyticsCache } from '@/lib/services/cache'
import { dbService } from '@/lib/services/db'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let cacheHit = false
  let cacheKey = ''

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

    // Generate cache key for user-specific dashboard data
    cacheKey = analyticsCache.generateKey('dashboard:data', {
      userId: user.id,
      version: '1.0' // Cache version for future invalidation
    }, user.id)

    // Try to get cached dashboard data first
    const cachedData = await analyticsCache.get<any>(cacheKey, user.id)
    
    if (cachedData) {
      cacheHit = true
      const queryTime = Date.now() - startTime
      
      console.log(`🎯 Cache HIT for dashboard data (${queryTime}ms) - User: ${user.id}`)
      
      const response = NextResponse.json({
        ...cachedData,
        metadata: {
          ...(cachedData.metadata || {}),
          queryTime,
          cached: true,
          cacheHit: true,
          timestamp: new Date().toISOString(),
          userId: user.id
        }
      })
      
      // Add cache headers
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('X-Cache-Key', cacheKey)
      response.headers.set('X-Query-Time', queryTime.toString())
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', '30')
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

      return response
    }

    console.log(`🔄 Cache MISS for dashboard data - User: ${user.id}, fetching fresh data...`)

    // Cache miss - fetch fresh data with database retry logic
    const analyticsService = new AnalyticsService()
    
    // Use Promise.allSettled to handle partial failures gracefully
    const [analyticsResult, receiptsResult] = await dbService.executeWithRetry(async () => {
      return Promise.allSettled([
        // Get analytics overview with retry logic
        analyticsService.getOverview(user.id),
        // Get recent receipts with retry logic
        getReceiptsByUserId(user.id, { take: 5, orderBy: 'purchaseDate', order: 'desc' })
      ])
    })

    // Handle partial failures gracefully
    const analyticsData = analyticsResult.status === 'fulfilled' ? analyticsResult.value : { data: { totalSpent: 0, receiptCount: 0, averageReceipt: 0 } }
    const recentReceipts = receiptsResult.status === 'fulfilled' ? receiptsResult.value : []

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

    // Cache the fresh data with user-specific TTL
    const cacheOptions = {
      userId: user.id,
      ttl: 2 * 60 * 1000, // 2 minutes TTL for dashboard data
      priority: 'high' as const
    }

    await analyticsCache.set(cacheKey, {
      ...dashboardData,
      metadata: {
        queryTime,
        cached: false,
        cacheHit: false,
        timestamp: new Date().toISOString(),
        userId: user.id,
        cacheKey
      }
    }, cacheOptions)

    console.log(`💾 Cached fresh dashboard data (${queryTime}ms) - User: ${user.id}`)

    // Add cache headers to response
    const response = NextResponse.json({
      ...dashboardData,
      metadata: {
        queryTime,
        cached: false,
        cacheHit: false,
        timestamp: new Date().toISOString(),
        userId: user.id,
        cacheKey
      }
    })
    
    // Add cache headers
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('X-Cache-Key', cacheKey)
    response.headers.set('X-Query-Time', queryTime.toString())
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '30')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

    return response

  } catch (error) {
    console.error('Dashboard data API error:', error)
    
    // Try to return cached data as fallback if available
    if (cacheKey) {
      try {
        const fallbackData = await analyticsCache.get<any>(cacheKey)
        if (fallbackData) {
          console.log(`🔄 Returning cached fallback data due to error`)
          return NextResponse.json({
            ...fallbackData,
            metadata: {
              ...(fallbackData.metadata || {}),
              error: 'Using cached data due to database error',
              timestamp: new Date().toISOString()
            }
          })
        }
      } catch (cacheError) {
        console.error('Cache fallback error:', cacheError)
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 