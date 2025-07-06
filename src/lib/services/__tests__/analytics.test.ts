// ============================================================================
// ANALYTICS SERVICE UNIT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for analytics service with caching, filtering, and performance monitoring

import { AnalyticsService } from '../analytics';
import { analyticsCache } from '../cache';
import { prisma } from '../../prisma';

// ============================================================================
// MOCKING SETUP (see master guide: Mocking Practices)
// ============================================================================

// Mock Prisma for database operations
jest.mock('../../prisma', () => ({
  prisma: {
    receipt: {
      aggregate: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  },
}));

// Mock cache service for analytics caching
jest.mock('../cache', () => ({
  analyticsCache: {
    get: jest.fn(),
    set: jest.fn(),
    generateKey: jest.fn(),
    invalidatePattern: jest.fn(),
    getStats: jest.fn(),
  },
}));

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should return cached data when available', async () => {
      // Arrange
      const cachedData = {
        totalSpent: 1000,
        receiptCount: 10,
        averageReceipt: 100,
        dateRange: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
      };

      (analyticsCache.get as jest.Mock).mockResolvedValue(cachedData);
      (analyticsCache.generateKey as jest.Mock).mockReturnValue('test-key');

      // Act
      const result = await analyticsService.getOverview(mockUserId);

      // Assert
      expect(result.data).toEqual(cachedData);
      expect(result.metadata.cached).toBe(true);
      expect(analyticsCache.get).toHaveBeenCalledWith('test-key');
    });

    it('should fetch and cache data when not cached', async () => {
      // Arrange
      const mockAggregate = {
        _sum: { total: 1000 },
        _count: 10,
        _avg: { total: 100 },
      };
      const mockFirst = { purchaseDate: new Date('2024-01-01') };
      const mockLast = { purchaseDate: new Date('2024-12-31') };

      (analyticsCache.get as jest.Mock).mockResolvedValue(null);
      (analyticsCache.generateKey as jest.Mock).mockReturnValue('test-key');
      (prisma.receipt.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
      (prisma.receipt.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockFirst)
        .mockResolvedValueOnce(mockLast);

      // Act
      const result = await analyticsService.getOverview(mockUserId);

      // Assert
      expect(result.data.totalSpent).toBe(1000);
      expect(result.data.receiptCount).toBe(10);
      expect(result.data.averageReceipt).toBe(100);
      expect(result.metadata.cached).toBe(false);
      expect(analyticsCache.set).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        categories: ['Food'],
        merchants: ['Walmart'],
        amountRange: { min: 10, max: 1000 },
      };

      (analyticsCache.get as jest.Mock).mockResolvedValue(null);
      (analyticsCache.generateKey as jest.Mock).mockReturnValue('test-key');
      (prisma.receipt.aggregate as jest.Mock).mockResolvedValue({
        _sum: { total: 500 },
        _count: 5,
        _avg: { total: 100 },
      });
      (prisma.receipt.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      await analyticsService.getOverview(mockUserId, filters);

      // Assert
      expect(prisma.receipt.aggregate).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          purchaseDate: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end,
          },
          category: { in: filters.categories },
          merchant: { in: filters.merchants },
          total: {
            gte: filters.amountRange.min,
            lte: filters.amountRange.max,
          },
        },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      });
    });
  });

  describe('getSpendingTrends', () => {
    it('should return monthly trends with caching', async () => {
      // Arrange
      const mockTrends = [
        { period: '2024-01', amount: '500', receiptCount: '5' },
        { period: '2024-02', amount: '600', receiptCount: '6' },
      ];

      (analyticsCache.get as jest.Mock).mockResolvedValue(null);
      (analyticsCache.generateKey as jest.Mock).mockReturnValue('test-key');
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockTrends);

      // Act
      const result = await analyticsService.getSpendingTrends(mockUserId, 'monthly');

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].period).toBe('2024-01');
      expect(result.data[0].amount).toBe(500);
      expect(result.data[0].receiptCount).toBe(5);
      expect(result.metadata.cached).toBe(false);
    });

    it('should return yearly trends', async () => {
      // Arrange
      const mockTrends = [
        { period: '2024', amount: '1200', receiptCount: '12' },
      ];

      (analyticsCache.get as jest.Mock).mockResolvedValue(null);
      (analyticsCache.generateKey as jest.Mock).mockReturnValue('test-key');
      (prisma.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockTrends);

      // Act
      const result = await analyticsService.getSpendingTrends(mockUserId, 'yearly');

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].period).toBe('2024');
      expect(result.data[0].amount).toBe(1200);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should return category breakdown with percentages', async () => {
      // Arrange
      const mockCategories = [
        {
          category: 'Food',
          _sum: { total: 600 },
          _count: { _all: 6 },
        },
        {
          category: 'Transportation',
          _sum: { total: 400 },
          _count: { _all: 4 },
        },
      ];

      (analyticsCache.get as jest.Mock).mockResolvedValue(null);
      (analyticsCache.generateKey as jest.Mock).mockReturnValue('test-key');
      (prisma.receipt.groupBy as jest.Mock).mockResolvedValue(mockCategories);

      // Act
      const result = await analyticsService.getCategoryBreakdown(mockUserId);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].category).toBe('Food');
      expect(result.data[0].amount).toBe(600);
      expect(result.data[0].percentage).toBe(60); // 600/1000 * 100
      expect(result.data[0].receiptCount).toBe(6);
    });
  });

  describe('getTopMerchants', () => {
    it('should return top merchants with limit', async () => {
      // Arrange
      const mockMerchants = [
        {
          merchant: 'Walmart',
          _sum: { total: 300 },
          _count: { _all: 3 },
        },
        {
          merchant: 'Target',
          _sum: { total: 200 },
          _count: { _all: 2 },
        },
      ];

      (analyticsCache.get as jest.Mock).mockResolvedValue(null);
      (analyticsCache.generateKey as jest.Mock).mockReturnValue('test-key');
      (prisma.receipt.groupBy as jest.Mock).mockResolvedValue(mockMerchants);

      // Act
      const result = await analyticsService.getTopMerchants(mockUserId, 2);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].merchant).toBe('Walmart');
      expect(result.data[0].amount).toBe(300);
      expect(result.data[0].receiptCount).toBe(3);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate user cache', async () => {
      // Act
      await analyticsService.invalidateUserCache(mockUserId);

      // Assert
      expect(analyticsCache.invalidatePattern).toHaveBeenCalledWith(
        `overview:userId:${mockUserId}`
      );
      expect(analyticsCache.invalidatePattern).toHaveBeenCalledWith(
        `trends:userId:${mockUserId}`
      );
      expect(analyticsCache.invalidatePattern).toHaveBeenCalledWith(
        `categories:userId:${mockUserId}`
      );
      expect(analyticsCache.invalidatePattern).toHaveBeenCalledWith(
        `merchants:userId:${mockUserId}`
      );
    });

    it('should return cache stats', () => {
      // Arrange
      const mockStats = {
        hits: 10,
        misses: 5,
        size: 15,
        keys: ['key1', 'key2'],
      };

      (analyticsCache.getStats as jest.Mock).mockReturnValue(mockStats);

      // Act
      const stats = analyticsService.getCacheStats();

      // Assert
      expect(stats).toEqual(mockStats);
    });
  });
}); 