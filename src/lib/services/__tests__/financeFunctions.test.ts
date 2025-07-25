import {
  getSpendingByCategory,
  getSpendingByTime,
  getSpendingByVendor,
  getSpendingForCustomPeriod,
  getSpendingComparison,
  detectSpendingAnomalies,
  getSpendingTrends,
  summarizeTopVendors,
  summarizeTopCategories,
} from '../financeFunctions';

// Mock the Prisma client
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

describe('Finance Functions - Database Integration', () => {
  const mockUserId = 'test-user-123';
  const mockTimeframe = {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSpendingByCategory', () => {
    it('should return spending by category with real database query', async () => {
      const mockAggregateResult = {
        _sum: { total: 150.50 },
      };

      mockAggregate.mockResolvedValue(mockAggregateResult);

      const result = await getSpendingByCategory({
        userId: mockUserId,
        category: 'Food & Dining',
        timeframe: mockTimeframe,
      });

      expect(mockAggregate).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          category: 'Food & Dining',
          purchaseDate: {
            gte: mockTimeframe.start,
            lte: mockTimeframe.end,
          },
        },
        _sum: { total: true },
      });

      expect(result).toEqual({
        category: 'Food & Dining',
        total: 150.50,
        currency: 'USD',
      });
    });

    it('should handle null total gracefully', async () => {
      mockAggregate.mockResolvedValue({
        _sum: { total: null },
      });

      const result = await getSpendingByCategory({
        userId: mockUserId,
        category: 'Food & Dining',
      });

      expect(result.total).toBe(0);
    });

    it('should throw error on database failure', async () => {
      mockAggregate.mockRejectedValue(new Error('Database error'));

      await expect(
        getSpendingByCategory({
          userId: mockUserId,
          category: 'Food & Dining',
        })
      ).rejects.toThrow('Failed to retrieve spending by category');
    });
  });

  describe('getSpendingByTime', () => {
    it('should return spending for time period', async () => {
      const mockAggregateResult = {
        _sum: { total: 500.75 },
      };

      mockAggregate.mockResolvedValue(mockAggregateResult);

      const result = await getSpendingByTime({
        userId: mockUserId,
        timeframe: mockTimeframe,
      });

      expect(mockAggregate).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          purchaseDate: {
            gte: mockTimeframe.start,
            lte: mockTimeframe.end,
          },
        },
        _sum: { total: true },
      });

      expect(result).toEqual({
        period: mockTimeframe,
        total: 500.75,
        currency: 'USD',
      });
    });
  });

  describe('getSpendingByVendor', () => {
    it('should return spending by vendor', async () => {
      const mockAggregateResult = {
        _sum: { total: 200.25 },
      };

      mockAggregate.mockResolvedValue(mockAggregateResult);

      const result = await getSpendingByVendor({
        userId: mockUserId,
        vendor: 'Amazon',
        timeframe: mockTimeframe,
      });

      expect(mockAggregate).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          merchant: 'Amazon',
          purchaseDate: {
            gte: mockTimeframe.start,
            lte: mockTimeframe.end,
          },
        },
        _sum: { total: true },
      });

      expect(result).toEqual({
        vendor: 'Amazon',
        total: 200.25,
        currency: 'USD',
      });
    });
  });

  describe('getSpendingForCustomPeriod', () => {
    it('should return spending breakdown by category', async () => {
      const mockTotalResult = {
        _sum: { total: 1000.00 },
      };

      const mockBreakdownResult = [
        {
          category: 'Food & Dining',
          _sum: { total: 400.00 },
        },
        {
          category: 'Transportation',
          _sum: { total: 300.00 },
        },
        {
          category: 'Shopping',
          _sum: { total: 300.00 },
        },
      ];

      mockAggregate
        .mockResolvedValueOnce(mockTotalResult);
      
      mockGroupBy
        .mockResolvedValueOnce(mockBreakdownResult);

      const result = await getSpendingForCustomPeriod({
        userId: mockUserId,
        timeframe: mockTimeframe,
      });

      expect(result).toEqual({
        period: mockTimeframe,
        total: 1000.00,
        breakdown: [
          { category: 'Food & Dining', total: 400.00, currency: 'USD' },
          { category: 'Transportation', total: 300.00, currency: 'USD' },
          { category: 'Shopping', total: 300.00, currency: 'USD' },
        ],
        currency: 'USD',
      });
    });
  });

  describe('getSpendingComparison', () => {
    it('should compare spending between two periods', async () => {
      const periodA = { start: new Date('2024-01-01'), end: new Date('2024-01-31') };
      const periodB = { start: new Date('2024-02-01'), end: new Date('2024-02-29') };

      mockAggregate
        .mockResolvedValueOnce({ _sum: { total: 800.00 } }) // Period A
        .mockResolvedValueOnce({ _sum: { total: 1200.00 } }); // Period B

      const result = await getSpendingComparison({
        userId: mockUserId,
        periodA,
        periodB,
      });

      expect(result).toEqual({
        periodA: { range: periodA, total: 800.00 },
        periodB: { range: periodB, total: 1200.00 },
        difference: 400.00,
        currency: 'USD',
      });
    });

    it('should apply category filter when provided', async () => {
      const periodA = { start: new Date('2024-01-01'), end: new Date('2024-01-31') };
      const periodB = { start: new Date('2024-02-01'), end: new Date('2024-02-29') };

      mockAggregate
        .mockResolvedValueOnce({ _sum: { total: 200.00 } })
        .mockResolvedValueOnce({ _sum: { total: 300.00 } });

      await getSpendingComparison({
        userId: mockUserId,
        periodA,
        periodB,
        category: 'Food & Dining',
      });

      expect(mockAggregate).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          category: 'Food & Dining',
          purchaseDate: {
            gte: periodA.start,
            lte: periodA.end,
          },
        },
        _sum: { total: true },
      });
    });
  });

  describe('detectSpendingAnomalies', () => {
    it('should detect high amount anomalies', async () => {
      const historicalResult = {
        _avg: { total: 50.00 },
        _count: 10,
      };

      const currentTransactions = [
        {
          id: 'receipt-1',
          total: 150.00,
          currency: 'USD',
          merchant: 'Expensive Store',
          category: 'Shopping',
          purchaseDate: new Date('2024-01-15'),
        },
      ];

      mockAggregate.mockResolvedValue(historicalResult);
      mockFindMany.mockResolvedValue(currentTransactions);

      const result = await detectSpendingAnomalies({
        userId: mockUserId,
        timeframe: mockTimeframe,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'high_amount',
        entity: 'transaction',
        id: 'receipt-1',
        amount: 150.00,
        currency: 'USD',
        reason: expect.stringContaining('Unusually high amount ($150.00) compared to your average of $50.00'),
        details: expect.objectContaining({
          merchant: 'Expensive Store',
          category: 'Shopping',
          historicalAverage: 50.00,
          threshold: 100.00,
        }),
      });
    });

    it('should detect new vendor anomalies', async () => {
      const historicalResult = {
        _avg: { total: 50.00 },
        _count: 5,
      };

      const historicalVendors = [
        { merchant: 'Old Store' },
        { merchant: 'Another Store' },
      ];

      const currentTransactions = [
        {
          id: 'receipt-2',
          total: 75.00,
          currency: 'USD',
          merchant: 'New Store',
          category: 'Food & Dining',
          purchaseDate: new Date('2024-01-15'),
        },
      ];

      mockAggregate.mockResolvedValue(historicalResult);
      mockFindMany
        .mockResolvedValueOnce(currentTransactions)
        .mockResolvedValueOnce(historicalVendors);

      const result = await detectSpendingAnomalies({
        userId: mockUserId,
        timeframe: mockTimeframe,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'new_vendor',
        entity: 'vendor',
        id: 'receipt-2',
        amount: 75.00,
        currency: 'USD',
        reason: 'New vendor detected: New Store',
        details: expect.objectContaining({
          merchant: 'New Store',
          category: 'Food & Dining',
        }),
      });
    });
  });

  describe('getSpendingTrends', () => {
    it('should return spending trends by date', async () => {
      const mockTrends = [
        {
          purchaseDate: new Date('2024-01-01'),
          _sum: { total: 100.00 },
        },
        {
          purchaseDate: new Date('2024-01-02'),
          _sum: { total: 150.00 },
        },
      ];

      mockGroupBy.mockResolvedValue(mockTrends);

      const result = await getSpendingTrends({
        userId: mockUserId,
        timeframe: mockTimeframe,
      });

      expect(result).toEqual([
        { date: '2024-01-01', total: 100.00, currency: 'USD' },
        { date: '2024-01-02', total: 150.00, currency: 'USD' },
      ]);
    });
  });

  describe('summarizeTopVendors', () => {
    it('should return top vendors by spending', async () => {
      const mockVendors = [
        {
          merchant: 'Amazon',
          _sum: { total: 500.00 },
        },
        {
          merchant: 'Walmart',
          _sum: { total: 300.00 },
        },
      ];

      mockGroupBy.mockResolvedValue(mockVendors);

      const result = await summarizeTopVendors({
        userId: mockUserId,
        timeframe: mockTimeframe,
        N: 2,
      });

      expect(result).toEqual([
        { vendor: 'Amazon', total: 500.00, currency: 'USD' },
        { vendor: 'Walmart', total: 300.00, currency: 'USD' },
      ]);
    });
  });

  describe('summarizeTopCategories', () => {
    it('should return top categories by spending', async () => {
      const mockCategories = [
        {
          category: 'Food & Dining',
          _sum: { total: 400.00 },
        },
        {
          category: 'Transportation',
          _sum: { total: 250.00 },
        },
      ];

      mockGroupBy.mockResolvedValue(mockCategories);

      const result = await summarizeTopCategories({
        userId: mockUserId,
        timeframe: mockTimeframe,
        N: 2,
      });

      expect(result).toEqual([
        { category: 'Food & Dining', total: 400.00, currency: 'USD' },
        { category: 'Transportation', total: 250.00, currency: 'USD' },
      ]);
    });

    it('should handle uncategorized receipts', async () => {
      const mockCategories = [
        {
          category: null,
          _sum: { total: 100.00 },
        },
      ];

      mockGroupBy.mockResolvedValue(mockCategories);

      const result = await summarizeTopCategories({
        userId: mockUserId,
        timeframe: mockTimeframe,
        N: 1,
      });

      expect(result).toEqual([
        { category: 'Uncategorized', total: 100.00, currency: 'USD' },
      ]);
    });
  });
}); 