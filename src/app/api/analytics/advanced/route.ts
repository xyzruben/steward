// Advanced analytics API route for enhanced dashboard features
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
    const rateLimitKey = `analytics:advanced:${user.id}`;
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

    // Parse query parameters for advanced analytics
    const { searchParams } = new URL(request.url);
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

    // Merchant filtering
    const merchant = searchParams.get('merchant');
    if (merchant) {
      filters.merchants = [merchant];
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

    // Get the specific analytics type requested
    const type = searchParams.get('type') || 'overview';
    const analyticsService = new AnalyticsService();

    let result;
    let metadata;

    switch (type) {
      case 'overview':
        const overview = await analyticsService.getOverview(user.id, filters);
        result = overview.data;
        metadata = overview.metadata;
        break;

      case 'trends':
        const period = searchParams.get('period') as 'monthly' | 'yearly' || 'monthly';
        const trends = await analyticsService.getSpendingTrends(user.id, period, filters);
        result = trends.data;
        metadata = trends.metadata;
        break;

      case 'categories':
        const categories = await analyticsService.getCategoryBreakdown(user.id, filters);
        result = categories.data;
        metadata = categories.metadata;
        break;

      case 'merchants':
        const limit = parseInt(searchParams.get('limit') || '10');
        const merchants = await analyticsService.getTopMerchants(user.id, limit, filters);
        result = merchants.data;
        metadata = merchants.metadata;
        break;

      case 'daily-breakdown':
        const dailyBreakdown = await analyticsService.getDailyBreakdown(user.id, filters);
        result = dailyBreakdown.data;
        metadata = dailyBreakdown.metadata;
        break;

      case 'spending-patterns':
        const patterns = await analyticsService.getSpendingPatterns(user.id, filters);
        result = patterns.data;
        metadata = patterns.metadata;
        break;

      case 'export-data':
        const exportData = await analyticsService.getExportData(user.id, filters);
        result = exportData.data;
        metadata = exportData.metadata;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    // Add rate limit headers to response
    const response = NextResponse.json({
      data: result,
      metadata,
      filters,
      type,
    });
    
    response.headers.set('X-RateLimit-Limit', '30');
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

    return response;
  } catch (error) {
    // Secure error handling (see master guide: Secure Error Handling)
    console.error('Advanced analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 