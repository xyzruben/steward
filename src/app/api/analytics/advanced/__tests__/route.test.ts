// Advanced Analytics API route tests
// See: Master System Guide - Testing and Quality Assurance, Unit Testing Strategy

import { NextRequest } from 'next/server';

// Mock all external dependencies
jest.mock('../../../../../lib/supabase', () => ({
  createSupabaseServerClient: jest.fn(),
}));

jest.mock('../../../../../lib/services/analytics', () => ({
  AnalyticsService: jest.fn(),
}));

jest.mock('../../../../../lib/rate-limiter', () => ({
  analyticsRateLimiter: {
    isAllowed: jest.fn().mockReturnValue({ allowed: true, remaining: 29, resetTime: Date.now() + 60000 }),
  },
}));

// Import after mocking
const { GET } = require('../route');

describe('Advanced Analytics API Route', () => {
  let mockRequest: NextRequest;
  let mockSupabaseClient: any;
  let mockAnalyticsService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
    };

    const { createSupabaseServerClient } = require('../../../../../lib/supabase');
    createSupabaseServerClient.mockReturnValue(mockSupabaseClient);

    // Mock AnalyticsService
    mockAnalyticsService = {
      getOverview: jest.fn().mockResolvedValue({
        data: { totalSpent: 1000, receiptCount: 10, averageReceipt: 100 },
        metadata: { cached: false, queryTime: 50, timestamp: new Date().toISOString() },
      }),
      getSpendingTrends: jest.fn().mockResolvedValue({
        data: [{ period: '2024-01', amount: 500, receiptCount: 5 }],
        metadata: { cached: false, queryTime: 30, timestamp: new Date().toISOString() },
      }),
      getCategoryBreakdown: jest.fn().mockResolvedValue({
        data: [{ category: 'Food', amount: 300, percentage: 30, receiptCount: 3 }],
        metadata: { cached: false, queryTime: 25, timestamp: new Date().toISOString() },
      }),
      getTopMerchants: jest.fn().mockResolvedValue({
        data: [{ merchant: 'Store', amount: 200, receiptCount: 2 }],
        metadata: { cached: false, queryTime: 20, timestamp: new Date().toISOString() },
      }),
      getDailyBreakdown: jest.fn().mockResolvedValue({
        data: [{ date: '2024-01-01', amount: 100, receiptCount: 1 }],
        metadata: { cached: false, queryTime: 15, timestamp: new Date().toISOString() },
      }),
      getSpendingPatterns: jest.fn().mockResolvedValue({
        data: {
          dayOfWeek: [{ day: 'Monday', amount: 150, receiptCount: 2 }],
          timeOfDay: [{ hour: 12, amount: 100, receiptCount: 1 }],
          averageByDay: 150,
          mostActiveDay: 'Monday',
          leastActiveDay: 'Sunday',
        },
        metadata: { cached: false, queryTime: 40, timestamp: new Date().toISOString() },
      }),
      getExportData: jest.fn().mockResolvedValue({
        data: {
          receipts: [{ id: '1', merchant: 'Store', total: 100, purchaseDate: '2024-01-01' }],
          summary: { totalReceipts: 1, totalSpent: 100, averageReceipt: 100 },
        },
        metadata: { cached: false, queryTime: 10, timestamp: new Date().toISOString() },
      }),
    };

    const { AnalyticsService } = require('../../../../../lib/services/analytics');
    AnalyticsService.mockImplementation(() => mockAnalyticsService);
  });

  const createMockRequest = (url: string): NextRequest => {
    return new NextRequest(url, {
      method: 'GET',
    });
  };

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      mockRequest = createMockRequest('http://localhost:3000/api/analytics/advanced?type=overview');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Analytics Types', () => {
    it('should handle overview analytics type', async () => {
      mockRequest = createMockRequest('http://localhost:3000/api/analytics/advanced?type=overview');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('overview');
      expect(data.data).toBeDefined();
      expect(mockAnalyticsService.getOverview).toHaveBeenCalledWith('test-user-id', {});
    });

    it('should handle trends analytics type', async () => {
      mockRequest = createMockRequest('http://localhost:3000/api/analytics/advanced?type=trends&period=monthly');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('trends');
      expect(data.data).toBeDefined();
      expect(mockAnalyticsService.getSpendingTrends).toHaveBeenCalledWith('test-user-id', 'monthly', {});
    });

    it('should return 400 for invalid analytics type', async () => {
      mockRequest = createMockRequest('http://localhost:3000/api/analytics/advanced?type=invalid');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid analytics type');
    });
  });

  describe('Filtering', () => {
    it('should handle date range filters', async () => {
      mockRequest = createMockRequest(
        'http://localhost:3000/api/analytics/advanced?type=overview&startDate=2024-01-01&endDate=2024-01-31'
      );
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.dateRange).toBeDefined();
    });

    it('should handle category filter', async () => {
      mockRequest = createMockRequest(
        'http://localhost:3000/api/analytics/advanced?type=overview&category=Food'
      );
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.categories).toEqual(['Food']);
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics service errors', async () => {
      mockAnalyticsService.getOverview.mockRejectedValue(new Error('Service error'));

      mockRequest = createMockRequest('http://localhost:3000/api/analytics/advanced?type=overview');
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
}); 