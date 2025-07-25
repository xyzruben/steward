import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase';
import { FinanceAgent, AgentResponse } from '@/lib/services/financeAgent';

/**
 * API route for Steward's AI-native financial assistant agent.
 * Aligns with Steward Master System Guide (see docs/STEWARD_MASTER_SYSTEM_GUIDE.md).
 *
 * POST /api/agent/query
 * Body: { query: string }
 * Response: { message: string, data: any, insights?: string[], error?: string }
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
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
    }

    // 3. Instantiate agent and handle query
    const agent = new FinanceAgent();
    const result: AgentResponse = await agent.handleQuery(userQuery, { userId });

    // 4. Return agent response with proper status codes
    if (result.error) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    // 5. Error handling
    // Log error (TODO: Add structured logging per Master System Guide)
    console.error('Agent API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ 
      error: errorMessage,
      message: 'I encountered an error while processing your request. Please try again.',
      data: null 
    }, { status: 500 });
  }
}

// TODO: Add unit and integration tests for this API route 