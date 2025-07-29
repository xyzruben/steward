// ============================================================================
// AI AGENT API TESTS - Critical Paths Only
// ============================================================================
// Focused tests for the most essential functionality
// Covers: basic queries, caching, rate limiting, error handling

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/agent/query/route';
import { FinanceAgent } from '@/lib/services/financeAgent';
import { agentCache } from '@/lib/services/cache';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}));

jest.mock('@/lib/services/financeAgent');
jest.mock('@/lib/services/cache');

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ name: 'sb-access-token', value: 'mock-token' })
  })
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url: string, options: any = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.body = options.body;
      this.cookies = {
        get: jest.fn().mockReturnValue({ name: 'sb-access-token', value: 'mock-token' })
      };
    }
    url: string;
    method: string;
    body: any;
    cookies: any;
  },
  NextResponse: {
    json: jest.fn((data: any, options?: any) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
      headers: new Map()
    }))
  }
}));

describe('AI Agent API - Critical Paths', () => {
  let mockRequest: NextRequest;
  let mockUser: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup authenticated user
    mockUser = { id: 'test-user-123' };
    const { createSupabaseServerClient } = require('@/lib/supabase');
    createSupabaseServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    });

    // Setup cache mock
    (agentCache.get as jest.Mock).mockResolvedValue(null);
    (agentCache.setSync as jest.Mock).mockReturnValue(undefined);
    
    // Setup FinanceAgent mock
    (FinanceAgent as unknown as jest.Mock).mockImplementation(() => ({
      processQuery: jest.fn().mockResolvedValue({
        message: 'Default response',
        data: {},
        executionTime: 1000
      })
    }));
  });

  describe('POST /api/agent/query', () => {
    it('should process valid query and return AI response', async () => {
      // Arrange
      const mockAgentResponse = {
        message: 'Your spending analysis is ready',
        data: { total: 1500, currency: 'USD' },
        insights: ['You spent $1500 this month'],
        executionTime: 2500,
        functionsUsed: ['getSpendingByTime']
      };

      (FinanceAgent as unknown as jest.Mock).mockImplementation(() => ({
        processQuery: jest.fn().mockResolvedValue(mockAgentResponse)
      }));

      mockRequest = new NextRequest('http://localhost:3000/api/agent/query', {
        method: 'POST',
        body: JSON.stringify({ query: 'How much did I spend this month?' })
      });

      // Act
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.message).toBe('Your spending analysis is ready');
      expect(result.data.total).toBe(1500);
      expect(result.functionsUsed).toContain('getSpendingByTime');
      expect(result.executionTime).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should return cached response when available', async () => {
      // Arrange
      const cachedResponse = {
        message: 'Cached response',
        data: { cached: true },
        executionTime: 100
      };

      (agentCache.get as jest.Mock).mockResolvedValue(cachedResponse);

      mockRequest = new NextRequest('http://localhost:3000/api/agent/query', {
        method: 'POST',
        body: JSON.stringify({ query: 'How much did I spend this month?' })
      });

      // Act
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.message).toBe('Cached response');
      expect(result.data.cached).toBe(true);
      expect(result.executionTime).toBe(100);
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      const { createSupabaseServerClient } = require('@/lib/supabase');
      createSupabaseServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: 'Unauthorized' })
        }
      });

      mockRequest = new NextRequest('http://localhost:3000/api/agent/query', {
        method: 'POST',
        body: JSON.stringify({ query: 'How much did I spend?' })
      });

      // Act
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid query', async () => {
      // Arrange
      mockRequest = new NextRequest('http://localhost:3000/api/agent/query', {
        method: 'POST',
        body: JSON.stringify({ query: '' })
      });

      // Act
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(result.error).toBe('Query cannot be empty');
    });

    it('should handle AI agent errors gracefully', async () => {
      // Arrange
      (FinanceAgent as unknown as jest.Mock).mockImplementation(() => ({
        processQuery: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
      }));

      mockRequest = new NextRequest('http://localhost:3000/api/agent/query', {
        method: 'POST',
        body: JSON.stringify({ query: 'How much did I spend?' })
      });

      // Act
      const response = await POST(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.error).toBe('Internal server error');
      expect(result.executionTime).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });
}); 