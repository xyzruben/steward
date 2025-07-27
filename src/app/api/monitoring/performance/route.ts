// ============================================================================
// PERFORMANCE MONITORING API ROUTE
// ============================================================================
// Provides real-time performance metrics and monitoring data
// See: Master System Guide - API Route Principles, Authentication and Authorization

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '../../../../lib/supabase';
import { performanceMonitoring } from '../../../../lib/services/performance';
import { analyticsRateLimiter } from '../../../../lib/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    // Authentication check (see master guide: Authentication and Authorization)
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting (see master guide: Rate Limiting and Validation)
    const rateLimitKey = `monitoring:performance:${user.id}`;
    const rateLimit = analyticsRateLimiter.isAllowed(rateLimitKey);
    
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
      );
    }

    // Parse query parameters for time range
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1h';
    
    // Calculate time range
    const end = new Date();
    let start: Date;
    
    switch (timeRange) {
      case '1h':
        start = new Date(end.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 60 * 60 * 1000); // Default to 1h
    }

    // Get performance dashboard data
    const dashboard = await performanceMonitoring.getPerformanceDashboard({ start, end });

    // Add rate limit headers to response
    const response = NextResponse.json({
      ...dashboard,
      metadata: {
        timeRange: {
          start: start.toISOString(),
          end: end.toISOString(),
          duration: timeRange,
        },
        timestamp: new Date().toISOString(),
        userId: user.id,
      },
    });
    
    response.headers.set('X-RateLimit-Limit', '30');
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

    return response;
  } catch (error) {
    // Secure error handling (see master guide: Secure Error Handling)
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 