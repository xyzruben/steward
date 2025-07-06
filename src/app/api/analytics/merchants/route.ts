// Analytics merchants API route
// See: Master System Guide - API Route Principles, Authentication and Authorization, Security Requirements

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '../../../../lib/supabase';
import { AnalyticsService } from '../../../../lib/services/analytics';
import { analyticsRateLimiter } from '../../../../lib/rate-limiter';
import type { AnalyticsFilters } from '../../../../types/analytics';

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
    const rateLimitKey = `analytics:merchants:${user.id}`;
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
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    
    // Parse filters
    const filters: AnalyticsFilters = {};
    
    // Date range filtering
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    // Category filtering
    const category = searchParams.get('category');
    if (category) {
      filters.categories = [category];
    }

    // Amount range filtering
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    if (minAmount || maxAmount) {
      filters.amountRange = {
        min: minAmount ? parseFloat(minAmount) : 0,
        max: maxAmount ? parseFloat(maxAmount) : Number.MAX_SAFE_INTEGER,
      };
    }

    // Get top merchants with filters
    const analyticsService = new AnalyticsService();
    const merchants = await analyticsService.getTopMerchants(user.id, limit, filters);

    // Add rate limit headers to response
    const response = NextResponse.json(merchants);
    response.headers.set('X-RateLimit-Limit', '50');
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

    return response;
  } catch (error) {
    // Secure error handling (see master guide: Secure Error Handling)
    console.error('Analytics merchants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 