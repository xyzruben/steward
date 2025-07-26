import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase';
import { FinanceAgent, AgentResponse, StreamingAgentResponse } from '@/lib/services/financeAgent';

/**
 * API route for Steward's AI-native financial assistant agent.
 * Aligns with Steward Master System Guide (see docs/STEWARD_MASTER_SYSTEM_GUIDE.md).
 *
 * POST /api/agent/query
 * Body: { query: string, streaming?: boolean }
 * Response: { message: string, data: any, insights?: string[], error?: string, cached?: boolean, executionTime?: number }
 * 
 * Performance Optimization: Added streaming responses and caching support
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user (following established pattern from other API routes)
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id; // Real user ID from Supabase

    // 2. Parse request body
    const body = await req.json();
    const userQuery = body.query;
    const streaming = body.streaming || false;
    
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
    }

    // 3. Instantiate agent and handle query
    const agent = new FinanceAgent();
    
    // 4. Handle streaming response
    if (streaming) {
      return handleStreamingResponse(agent, userQuery, userId);
    }
    
    // 5. Handle regular response
    const result = await agent.handleQuery(userQuery, userId) as AgentResponse;

    // 6. Return agent response with proper status codes
    if (result.error) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    // 7. Error handling
    console.error('Agent API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ 
      error: errorMessage,
      message: 'I encountered an error while processing your request. Please try again.',
      data: null 
    }, { status: 500 });
  }
}

/**
 * Handle streaming response for real-time feedback
 */
async function handleStreamingResponse(
  agent: FinanceAgent,
  userQuery: string,
  userId: string
): Promise<Response> {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamingResult = agent.handleQuery(userQuery, userId, true);
        
        if (Symbol.asyncIterator in streamingResult) {
          // Handle streaming response
          for await (const chunk of streamingResult as unknown as AsyncGenerator<StreamingAgentResponse>) {
            const data = JSON.stringify(chunk) + '\n';
            controller.enqueue(encoder.encode(data));
          }
        } else {
          // Handle regular response as single chunk
          const result = await streamingResult as AgentResponse;
          const data = JSON.stringify({
            type: 'complete',
            ...result
          }) + '\n';
          controller.enqueue(encoder.encode(data));
        }
        
        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        const errorChunk = JSON.stringify({
          type: 'error',
          message: 'An error occurred during processing',
          error: error instanceof Error ? error.message : 'Unknown error'
        }) + '\n';
        controller.enqueue(encoder.encode(errorChunk));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * GET endpoint for cache statistics (admin/debug purposes)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'cache-stats':
        const stats = FinanceAgent.getCacheStats();
        return NextResponse.json({ stats });
      
      case 'clear-cache':
        FinanceAgent.clearUserCache(user.id);
        return NextResponse.json({ message: 'Cache cleared for user' });
      
      default:
        return NextResponse.json({ 
          message: 'Agent API is running',
          endpoints: {
            'POST /api/agent/query': 'Submit a query to the financial assistant',
            'GET /api/agent/query?action=cache-stats': 'Get cache statistics',
            'GET /api/agent/query?action=clear-cache': 'Clear user cache'
          }
        });
    }
  } catch (error) {
    console.error('Agent API GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// TODO: Add unit and integration tests for this API route 