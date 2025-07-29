import { FinanceAgent } from '@/lib/services/financeAgent';
import { createSupabaseServerClient } from '@/lib/supabase';

// Mock Supabase for testing
jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    }
  }))
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          [Symbol.asyncIterator]: function* () {
            // First chunk: content
            yield {
              choices: [{
                delta: {
                  content: 'I can help you analyze your spending.'
                }
              }]
            };
            
            // Second chunk: tool call
            yield {
              choices: [{
                delta: {
                  tool_calls: [{
                    index: 0,
                    function: {
                      name: 'getSpendingByTime',
                      arguments: JSON.stringify({
                        timeframe: {
                          start: '2025-07-01T00:00:00.000Z',
                          end: '2025-07-31T23:59:59.999Z'
                        }
                      })
                    }
                  }]
                }
              }]
            };
            
            // Final chunk: empty to signal completion
            yield {
              choices: [{
                delta: {}
              }]
            };
          }
        })
      }
    }
  }))
}));

describe('FinanceAgent Streaming', () => {
  let agent: FinanceAgent;

  beforeEach(() => {
    agent = new FinanceAgent();
  });

  test('should handle streaming query and return async generator', async () => {
    const query = 'How much did I spend in July?';
    const userId = 'test-user-id';

    // Test that handleQuery returns an async generator for streaming
    const result = await agent.processQuery(query, userId);
    
    expect(result).toBeDefined();
    expect(typeof (result as any)[Symbol.asyncIterator]).toBe('function');
  });

  test('should yield streaming responses in correct order', async () => {
    const query = 'How much did I spend in July?';
    const userId = 'test-user-id';

    const streamingResult = (await agent.handleQuery(query, userId, true)) as unknown as AsyncGenerator<any>;
    const responses: any[] = [];

    for await (const response of streamingResult) {
      responses.push(response);
    }

    // Should have at least a start and complete response
    expect(responses.length).toBeGreaterThan(0);
    
    // First response should be 'start'
    expect(responses[0].type).toBe('start');
    expect(responses[0].message).toBe('Analyzing your request...');

    // Last response should be 'complete'
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.type).toBe('complete');
    expect(lastResponse.message).toBeDefined();
  });

  test('should handle errors gracefully in streaming', async () => {
    // Mock OpenAI to throw an error
    const mockOpenAI = require('openai').OpenAI;
    mockOpenAI.mockImplementationOnce(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
        }
      }
    }));

    const agent = new FinanceAgent();
    const query = 'How much did I spend in July?';
    const userId = 'test-user-id';

    const streamingResult = (await agent.handleQuery(query, userId, true)) as unknown as AsyncGenerator<any>;
    const responses: any[] = [];

    for await (const response of streamingResult) {
      responses.push(response);
    }

    // Should have start response and error response
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0].type).toBe('start');

    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.type).toBe('error');
    expect(lastResponse.error).toContain('OpenAI API error');
  });
}); 