// ============================================================================
// LOAD TESTING API ROUTE
// ============================================================================
// Provides load testing capabilities for performance validation
// See: Master System Guide - API Route Principles, Authentication and Authorization

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '../../../../lib/supabase';
import { performanceMonitoring } from '../../../../lib/services/performance';
import { analyticsRateLimiter } from '../../../../lib/rate-limiter';

export async function POST(request: NextRequest) {
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
    const rateLimitKey = `monitoring:load-test:${user.id}`;
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
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { testName, requests, concurrency } = body;

    // Validate input parameters
    if (!testName || typeof testName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid test name' },
        { status: 400 }
      );
    }

    if (!requests || typeof requests !== 'number' || requests < 1 || requests > 1000) {
      return NextResponse.json(
        { error: 'Invalid number of requests (1-1000)' },
        { status: 400 }
      );
    }

    if (!concurrency || typeof concurrency !== 'number' || concurrency < 1 || concurrency > 50) {
      return NextResponse.json(
        { error: 'Invalid concurrency level (1-50)' },
        { status: 400 }
      );
    }

    // Define the test request function
    const testRequest = async () => {
      const startTime = Date.now();
      
      try {
        // Make a test request to the AI agent
        const response = await fetch(`${request.nextUrl.origin}/api/agent/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            query: 'How much did I spend last month?',
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const duration = Date.now() - startTime;

        // Track performance
        await performanceMonitoring.trackPerformance(
          'load-test:ai-query',
          duration,
          true,
          user.id,
          {
            testName,
            responseSize: JSON.stringify(result).length,
            cacheHit: false,
          }
        );

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Track failed request
        await performanceMonitoring.trackPerformance(
          'load-test:ai-query',
          duration,
          false,
          user.id,
          {
            testName,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          error instanceof Error ? error.message : 'Unknown error'
        );

        throw error;
      }
    };

    // Run the load test
    const loadTestResult = await performanceMonitoring.runLoadTest(
      testName,
      requests,
      concurrency,
      testRequest
    );

    // Add rate limit headers to response
    const response = NextResponse.json({
      ...loadTestResult,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: user.id,
        testConfiguration: {
          testName,
          requests,
          concurrency,
        },
      },
    });
    
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());

    return response;
  } catch (error) {
    // Secure error handling (see master guide: Secure Error Handling)
    console.error('Load testing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 