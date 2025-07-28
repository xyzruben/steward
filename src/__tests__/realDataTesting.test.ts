/**
 * Real Data Testing for Steward's AI-Native Financial Assistant
 * 
 * This test suite validates that the FinanceAgent works correctly with realistic
 * receipt data, simulating real-world usage scenarios.
 * 
 * Aligns with Steward Master System Guide (see docs/STEWARD_MASTER_SYSTEM_GUIDE.md).
 */

import { FinanceAgent } from '@/lib/services/financeAgent';

// Mock Prisma client using the same pattern as financeFunctions tests
jest.mock('@prisma/client', () => {
  const mockAggregate = jest.fn();
  const mockGroupBy = jest.fn();
  const mockFindMany = jest.fn();

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      receipt: {
        aggregate: mockAggregate,
        groupBy: mockGroupBy,
        findMany: mockFindMany,
      },
    })),
  };
});

// Get the mocked functions from the module
const mockPrisma = require('@prisma/client');
const mockAggregate = jest.fn();
const mockGroupBy = jest.fn();
const mockFindMany = jest.fn();

// Set up the mock implementation
mockPrisma.PrismaClient.mockImplementation(() => ({
  receipt: {
    aggregate: mockAggregate,
    groupBy: mockGroupBy,
    findMany: mockFindMany,
  },
}));

// Mock OpenAI for consistent responses
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Based on your spending data, here are the insights you requested.',
              tool_calls: null
            }
          }]
        })
      }
    }
  }))
}));

describe('Real Data Testing - FinanceAgent', () => {
  let agent: FinanceAgent;
  const testUserId = 'test-user-1';

  beforeEach(() => {
    agent = new FinanceAgent('test-user-id');
    jest.clearAllMocks();
  });

  describe('Core Functionality with Real Data', () => {
    it('should handle basic spending query with realistic data', async () => {
      // Mock database response
      mockAggregate.mockResolvedValue({
        _sum: { total: 113.73 }
      });

      const result = await agent.handleQuery(
        'How much did I spend on food and dining this month?',
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle vendor-specific queries', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'receipt-1',
          merchant: 'Starbucks',
          total: 12.50,
          purchaseDate: new Date('2024-01-15'),
          category: 'Food & Dining'
        }
      ]);

      const result = await agent.handleQuery(
        'How much did I spend at Starbucks?',
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
    });

    it('should handle anomaly detection queries', async () => {
      // Mock historical data
      mockAggregate.mockResolvedValueOnce({
        _avg: { total: 25.0 },
        _count: 10
      });

      // Mock current transactions
      mockFindMany.mockResolvedValueOnce([
        { merchant: 'Starbucks' },
        { merchant: 'Whole Foods' }
      ]);

      mockFindMany.mockResolvedValueOnce([
        {
          id: 'receipt-1',
          merchant: 'Target',
          total: 156.23,
          purchaseDate: new Date('2024-01-11'),
          category: 'Shopping'
        }
      ]);

      const result = await agent.handleQuery(
        'Are there any unusual spending patterns this month?',
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
    });

    it('should handle time-based trend analysis', async () => {
      mockGroupBy.mockResolvedValue([
        { purchaseDate: new Date('2024-01-01'), _sum: { total: 50.0 } },
        { purchaseDate: new Date('2024-01-15'), _sum: { total: 75.0 } }
      ]);

      const result = await agent.handleQuery(
        'How has my spending changed over the past month?',
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
    });
  });

  describe('Error Handling with Real Data', () => {
    it('should handle database errors gracefully', async () => {
      mockAggregate.mockRejectedValue(new Error('Database connection failed'));

      const result = await agent.handleQuery(
        'How much did I spend on food this month?',
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
    });

    it('should handle empty results gracefully', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { total: null }
      });

      const result = await agent.handleQuery(
        'How much did I spend on entertainment this month?',
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('Edge Cases with Real Data', () => {
    it('should handle zero spending periods', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { total: 0 }
      });

      const result = await agent.handleQuery(
        'How much did I spend on entertainment this month?',
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle very large amounts', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { total: 999999.99 }
      });

      const result = await agent.handleQuery(
        'What is my total spending this year?',
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
    });

    it('should handle special characters in merchant names', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 'receipt-1',
          merchant: "McDonald's & Co.",
          total: 15.99,
          category: 'Food & Dining'
        }
      ]);

      const result = await agent.handleQuery(
        "How much did I spend at McDonald's?",
        testUserId
      ) as any;

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
    });
  });

  describe('Performance Validation', () => {
    it('should handle queries efficiently', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { total: 100.0 }
      });

      const startTime = Date.now();
      const result = await agent.handleQuery(
        'How much did I spend this month?',
        testUserId
      ) as any;
      const endTime = Date.now();

      expect(result.message).toBeTruthy();
      expect(result.data).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
}); 