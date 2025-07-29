// ============================================================================
// AI AGENT QUERY API ROUTE - Enhanced for AI-First Architecture
// ============================================================================
// Optimized API endpoint with rate limiting, caching, and streaming support
// Focuses on AI agent performance with minimal overhead

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase';
import { FinanceAgent } from '@/lib/services/financeAgent';
import { logger } from '@/lib/services/logger';

// Simple in-memory rate limiting (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, limit: number, window: number): boolean {
  const now = Date.now();
  const key = `ai:${userId}`;
  const userLimit = rateLimitMap.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + window });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentication
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 10 requests per minute
    if (!checkRateLimit(user.id, 10, 60000)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again in a minute.',
        retryAfter: 60
      }, { status: 429 });
    }

    const { query, streaming = false } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required and must be a string' }, { status: 400 });
    }

    if (query.trim().length === 0) {
      return NextResponse.json({ error: 'Query cannot be empty' }, { status: 400 });
    }

    // Input validation
    if (query.length > 1000) {
      return NextResponse.json({ error: 'Query too long. Maximum 1000 characters.' }, { status: 400 });
    }

    const agent = new FinanceAgent();

    if (streaming) {
      return handleStreamingResponse(agent, query, user.id);
    } else {
      const result = await agent.processQuery(query, user.id);
      const executionTime = Date.now() - startTime;
      
      return NextResponse.json({
        ...result,
        executionTime,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('AI Agent API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        executionTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function handleStreamingResponse(agent: FinanceAgent, query: string, userId: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of agent.streamQuery(query, userId)) {
          const data = JSON.stringify(chunk) + '\n';
          controller.enqueue(encoder.encode(data));
        }
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        const errorData = JSON.stringify({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }) + '\n';
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Streaming': 'true'
    },
  });
}

/**
 * GET endpoint for cache statistics (admin/debug purposes)
 */
export async function GET(req: NextRequest) {
  try {
    // Handle cache clearing
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (action === 'clear-cache') {
      // Authenticate user before clearing cache
      const cookieStore = await cookies();
      const supabase = createSupabaseServerClient(cookieStore);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Clear user-specific cache
      FinanceAgent.clearUserCache(user.id);
      
      return NextResponse.json({ 
        message: 'Cache cleared successfully',
        userId: user.id 
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Agent cache clear error:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}

// TODO: Add unit and integration tests for this API route 