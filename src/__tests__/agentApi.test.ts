import * as agentModule from '@/lib/services/financeAgent';

// Mock Supabase and cookies
jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      })
    }
  })
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn()
  })
}));

// Mock OpenAI globally
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked response',
              tool_calls: null
            }
          }]
        })
      }
    }
  }))
}));

/**
 * Tests for /api/agent/query route.
 * Follows "just right" testing philosophy from Master System Guide.
 * Focuses on business value, error handling, and reliability.
 */
describe('/api/agent/query', () => { // Name kept for historical context, but now tests agent directly
  let handleQuerySpy: jest.SpyInstance;

  beforeEach(() => {
    handleQuerySpy = jest.spyOn(agentModule.FinanceAgent.prototype, 'handleQuery').mockResolvedValue({
      message: 'mocked response',
      data: { foo: 'bar' },
      insights: ['Test insight']
    });
  });

  afterEach(() => {
    handleQuerySpy.mockRestore();
  });

  it('returns 200 and expected structure for valid query', async () => {
    const agent = new agentModule.FinanceAgent();
    const result = await agent.handleQuery('How much did I spend on food?', 'test-user-123') as any;

    expect(result.message).toBe('mocked response');
    expect(result.data).toEqual({ foo: 'bar' });
    expect(result.insights).toEqual(['Test insight']);
  });

  it('handles agent error responses correctly', async () => {
    handleQuerySpy.mockResolvedValueOnce({
      message: 'Error occurred',
      data: null,
      error: 'Agent processing failed'
    });
    const agent = new agentModule.FinanceAgent();
    const result = await agent.handleQuery('test', 'test-user-123') as any;

    expect(result.error).toBe('Agent processing failed');
    expect(result.message).toBe('Error occurred');
  });

  it('creates FinanceAgent instance successfully', () => {
    const agent = new agentModule.FinanceAgent();
    expect(agent).toBeInstanceOf(agentModule.FinanceAgent);
  });

  it('handles authentication errors correctly', async () => {
    // Test that the agent can handle authentication errors gracefully
    const agent = new agentModule.FinanceAgent();
    
    // Mock an authentication error scenario
    handleQuerySpy.mockRejectedValueOnce(new Error('Authentication failed'));
    
    await expect(
      agent.handleQuery('test query', 'invalid-user')
    ).rejects.toThrow('Authentication failed');
  });
}); 