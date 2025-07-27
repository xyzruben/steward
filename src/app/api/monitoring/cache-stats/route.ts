// ============================================================================
// CACHE STATISTICS API ROUTE (see STEWARD_MASTER_SYSTEM_GUIDE.md - Monitoring and Observability)
// ============================================================================
// API endpoint for monitoring cache performance and statistics
// Follows master guide: API Route Principles, Monitoring and Observability

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { analyticsCache } from '@/lib/services/cache'
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
    const rateLimitKey = `cache-stats:${user.id}`
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
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    // Get cache statistics
    const cacheStats = analyticsCache.getStats()
    const cacheHealth = analyticsCache.getHealth()
    const userStats = analyticsCache.getUserStats(user.id)

    const response = NextResponse.json({
      cache: {
        stats: cacheStats,
        health: cacheHealth,
        userStats: userStats,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        userId: user.id,
        queryTime: 0, // Cache stats are instant
      }
    })
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '10')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

    return response

  } catch (error) {
    console.error('Cache stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 