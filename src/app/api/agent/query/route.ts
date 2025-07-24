import { NextRequest, NextResponse } from 'next/server';
import { FinanceAgent } from '@/lib/services/financeAgent';

/**
 * API route for Steward's AI-native financial assistant agent.
 * Aligns with Steward Master System Guide (see docs/STEWARD_MASTER_SYSTEM_GUIDE.md).
 *
 * POST /api/agent/query
 * Body: { query: string }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user (TODO: Integrate with real auth/session)
    // Example: const user = await getUserFromRequest(req);
    const userId = 'TODO-user-id'; // TODO: Replace with real user ID
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const userQuery = body.query;
    if (!userQuery || typeof userQuery !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid query' }, { status: 400 });
    }

    // 3. Instantiate agent and handle query
    const agent = new FinanceAgent();
    const result = await agent.handleQuery(userQuery, { userId });

    // 4. Return agent response
    return NextResponse.json(result);
  } catch (error) {
    // 5. Error handling
    // Log error (TODO: Add structured logging per Master System Guide)
    console.error('Agent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// TODO: Add unit and integration tests for this API route 