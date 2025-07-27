// Analytics service for dashboard
// See: Master System Guide - Backend/API Design, TypeScript Standards, Scalability and Performance

import { prisma } from '../prisma';
import { analyticsCache } from './cache';
import { dbService } from './db';
import type {
  AnalyticsOverview,
  SpendingTrend,
  CategoryBreakdown,
  MerchantAnalysis,
  AnalyticsResponse,
  AnalyticsFilters,
} from '../../types/analytics';

export class AnalyticsService {
  // Get overall analytics overview for a user with enhanced caching
  async getOverview(userId: string, filters?: AnalyticsFilters): Promise<AnalyticsResponse<AnalyticsOverview>> {
    const startTime = Date.now();
    const cacheKey = analyticsCache.generateKey('overview', { 
      userId, 
      filters: JSON.stringify(filters),
      version: '1.0' // Cache version for future invalidation
    }, userId);
    
    // Try to get from cache first with user isolation
    const cached = await analyticsCache.get<AnalyticsOverview>(cacheKey, userId);
    if (cached) {
      console.log(`🎯 Analytics cache HIT for overview - User: ${userId}`);
      return {
        data: cached,
        metadata: {
          cached: true,
          queryTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cacheKey,
        },
      };
    }

    console.log(`🔄 Analytics cache MISS for overview - User: ${userId}, fetching fresh data...`);

    // Build where clause with filters
    const whereClause = this.buildWhereClause(userId, filters);
    
    const [aggregate, first, last] = await dbService.executeWithRetry(async () => {
      return Promise.all([
        prisma.receipt.aggregate({
          where: whereClause,
          _sum: { total: true },
          _count: true,
          _avg: { total: true },
        }),
        prisma.receipt.findFirst({ where: whereClause, orderBy: { purchaseDate: 'asc' } }),
        prisma.receipt.findFirst({ where: whereClause, orderBy: { purchaseDate: 'desc' } }),
      ]);
    });

    const result = {
      totalSpent: Number(aggregate._sum.total ?? 0),
      receiptCount: aggregate._count,
      averageReceipt: Number(aggregate._avg.total ?? 0),
      dateRange: {
        start: first?.purchaseDate ?? null,
        end: last?.purchaseDate ?? null,
      },
    };

    // Cache the result
    await analyticsCache.set(cacheKey, result);

    return {
      data: result,
      metadata: {
        cached: false,
        queryTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    };
  }

  // Get monthly or yearly spending trends with caching and filtering
  async getSpendingTrends(
    userId: string, 
    period: 'monthly' | 'yearly' = 'monthly',
    filters?: AnalyticsFilters
  ): Promise<AnalyticsResponse<SpendingTrend[]>> {
    const startTime = Date.now();
    const cacheKey = analyticsCache.generateKey('trends', { 
      userId, 
      period, 
      filters: JSON.stringify(filters) 
    });
    
    // Try to get from cache first
    const cached = await analyticsCache.get<SpendingTrend[]>(cacheKey);
    if (cached) {
      return {
        data: cached,
        metadata: {
          cached: true,
          queryTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cacheKey,
        },
      };
    }

    // Build where clause with filters
    const whereClause = this.buildWhereClause(userId, filters);
    const whereCondition = this.buildSqlWhereCondition(whereClause);

    // Use raw SQL for group by month/year (Prisma groupBy limitations)
    const groupBy = period === 'monthly'
      ? `to_char("purchaseDate", 'YYYY-MM')`
      : `to_char("purchaseDate", 'YYYY')`;
    
    const results = await prisma.$queryRawUnsafe<Array<{
      period: string;
      amount: string;
      receiptCount: string;
    }>>(
      `SELECT ${groupBy} as period, SUM("total") as amount, COUNT(*) as "receiptCount"
       FROM "receipts"
       WHERE "userId" = $1::uuid ${whereCondition}
       GROUP BY period
       ORDER BY period ASC`,
      userId
    );

    const result = results.map(r => ({
      period: r.period,
      amount: Number(r.amount),
      receiptCount: Number(r.receiptCount),
    }));

    // Cache the result
    await analyticsCache.set(cacheKey, result);

    return {
      data: result,
      metadata: {
        cached: false,
        queryTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    };
  }

  // Get category breakdown for a user with caching and filtering
  async getCategoryBreakdown(
    userId: string, 
    filters?: AnalyticsFilters
  ): Promise<AnalyticsResponse<CategoryBreakdown[]>> {
    const startTime = Date.now();
    const cacheKey = analyticsCache.generateKey('categories', { 
      userId, 
      filters: JSON.stringify(filters) 
    });
    
    // Try to get from cache first
    const cached = await analyticsCache.get<CategoryBreakdown[]>(cacheKey);
    if (cached) {
      return {
        data: cached,
        metadata: {
          cached: true,
          queryTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cacheKey,
        },
      };
    }

    const whereClause = this.buildWhereClause(userId, filters);
    const results = await prisma.receipt.groupBy({
      by: ['category'],
      where: whereClause, // Remove the category filter to include null categories
      _sum: { total: true },
      _count: { _all: true },
    });

    const total = results.reduce((sum, r) => sum + Number(r._sum.total ?? 0), 0);
    const result = results.map(r => ({
      category: r.category || 'Uncategorized', // Handle null categories
      amount: Number(r._sum.total ?? 0),
      percentage: total ? (Number(r._sum.total ?? 0) / total) * 100 : 0,
      receiptCount: r._count._all,
    }));

    // Cache the result
    await analyticsCache.set(cacheKey, result);

    return {
      data: result,
      metadata: {
        cached: false,
        queryTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    };
  }

  // Get top merchants for a user with caching and filtering
  async getTopMerchants(
    userId: string, 
    limit = 5,
    filters?: AnalyticsFilters
  ): Promise<AnalyticsResponse<MerchantAnalysis[]>> {
    const startTime = Date.now();
    const cacheKey = analyticsCache.generateKey('merchants', { 
      userId, 
      limit, 
      filters: JSON.stringify(filters) 
    });
    
    // Try to get from cache first
    const cached = await analyticsCache.get<MerchantAnalysis[]>(cacheKey);
    if (cached) {
      return {
        data: cached,
        metadata: {
          cached: true,
          queryTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cacheKey,
        },
      };
    }

    const whereClause = this.buildWhereClause(userId, filters);
    const results = await prisma.receipt.groupBy({
      by: ['merchant'],
      where: whereClause,
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    const result = results.map(r => ({
      merchant: r.merchant,
      amount: Number(r._sum.total ?? 0),
      receiptCount: r._count._all,
    }));

    // Cache the result
    await analyticsCache.set(cacheKey, result);

    return {
      data: result,
      metadata: {
        cached: false,
        queryTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    };
  }

  // Build where clause for Prisma queries with filters
  private buildWhereClause(userId: string, filters?: AnalyticsFilters) {
    const whereClause: Record<string, unknown> = { userId };

    if (filters?.dateRange) {
      whereClause.purchaseDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    if (filters?.categories && filters.categories.length > 0) {
      whereClause.category = { in: filters.categories };
    }

    if (filters?.merchants && filters.merchants.length > 0) {
      whereClause.merchant = { in: filters.merchants };
    }

    if (filters?.amountRange) {
      whereClause.total = {
        gte: filters.amountRange.min,
        lte: filters.amountRange.max,
      };
    }

    return whereClause;
  }

  // Build SQL where condition for raw queries
  private buildSqlWhereCondition(whereClause: Record<string, unknown>): string {
    let condition = '';
    
    if (whereClause.purchaseDate) {
      condition += ` AND "purchaseDate" >= $2 AND "purchaseDate" <= $3`;
    }
    
    if (whereClause.category) {
      condition += ` AND "category" = ANY($4)`;
    }
    
    if (whereClause.merchant) {
      condition += ` AND "merchant" = ANY($5)`;
    }
    
    if (whereClause.total) {
      condition += ` AND "total" >= $6 AND "total" <= $7`;
    }
    
    return condition;
  }

  // Invalidate cache for a user when new data is added
  async invalidateUserCache(userId: string): Promise<void> {
    await analyticsCache.invalidatePattern(`overview:userId:${userId}`);
    await analyticsCache.invalidatePattern(`trends:userId:${userId}`);
    await analyticsCache.invalidatePattern(`categories:userId:${userId}`);
    await analyticsCache.invalidatePattern(`merchants:userId:${userId}`);
  }

  // Get cache statistics for monitoring
  getCacheStats() {
    return analyticsCache.getStats();
  }

  // Get daily spending breakdown for detailed analysis
  async getDailyBreakdown(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<AnalyticsResponse<Array<{ date: string; amount: number; receiptCount: number }>>> {
    const startTime = Date.now();
    const cacheKey = analyticsCache.generateKey('daily-breakdown', { 
      userId, 
      filters: JSON.stringify(filters) 
    });
    
    // Try to get from cache first
    const cached = await analyticsCache.get<Array<{ date: string; amount: number; receiptCount: number }>>(cacheKey);
    if (cached) {
      return {
        data: cached,
        metadata: {
          cached: true,
          queryTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cacheKey,
        },
      };
    }

    const whereClause = this.buildWhereClause(userId, filters);
    const whereCondition = this.buildSqlWhereCondition(whereClause);
    
    const results = await prisma.$queryRawUnsafe<Array<{
      date: string;
      amount: string;
      receiptCount: string;
    }>>(
      `SELECT to_char("purchaseDate", 'YYYY-MM-DD') as date, 
              SUM("total") as amount, 
              COUNT(*) as "receiptCount"
       FROM "receipts"
       WHERE "userId" = $1::uuid ${whereCondition}
       GROUP BY date
       ORDER BY date ASC`,
      userId
    );

    const result = results.map(r => ({
      date: r.date,
      amount: Number(r.amount),
      receiptCount: Number(r.receiptCount),
    }));

    // Cache the result
    await analyticsCache.set(cacheKey, result);

    return {
      data: result,
      metadata: {
        cached: false,
        queryTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    };
  }

  // Get spending patterns analysis (day of week, time of day, etc.)
  async getSpendingPatterns(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<AnalyticsResponse<{
    dayOfWeek: Array<{ day: string; amount: number; receiptCount: number }>;
    timeOfDay: Array<{ hour: number; amount: number; receiptCount: number }>;
    averageByDay: number;
    mostActiveDay: string;
    leastActiveDay: string;
  }>> {
    const startTime = Date.now();
    const cacheKey = analyticsCache.generateKey('spending-patterns', { 
      userId, 
      filters: JSON.stringify(filters) 
    });
    
    // Try to get from cache first
    const cached = await analyticsCache.get<{
      dayOfWeek: Array<{ day: string; amount: number; receiptCount: number }>;
      timeOfDay: Array<{ hour: number; amount: number; receiptCount: number }>;
      averageByDay: number;
      mostActiveDay: string;
      leastActiveDay: string;
    }>(cacheKey);
    if (cached) {
      return {
        data: cached,
        metadata: {
          cached: true,
          queryTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cacheKey,
        },
      };
    }

    const whereClause = this.buildWhereClause(userId, filters);
    const whereCondition = this.buildSqlWhereCondition(whereClause);
    
    // Get day of week patterns
    const dayOfWeekResults = await prisma.$queryRawUnsafe<Array<{
      day: string;
      amount: string;
      receiptCount: string;
    }>>(
      `SELECT to_char("purchaseDate", 'Day') as day, 
              SUM("total") as amount, 
              COUNT(*) as "receiptCount"
       FROM "receipts"
       WHERE "userId" = $1::uuid ${whereCondition}
       GROUP BY day
       ORDER BY amount DESC`,
      userId
    );

    // Get time of day patterns (hour)
    const timeOfDayResults = await prisma.$queryRawUnsafe<Array<{
      hour: string;
      amount: string;
      receiptCount: string;
    }>>(
      `SELECT EXTRACT(hour FROM "purchaseDate") as hour, 
              SUM("total") as amount, 
              COUNT(*) as "receiptCount"
       FROM "receipts"
       WHERE "userId" = $1::uuid ${whereCondition}
       GROUP BY hour
       ORDER BY hour ASC`,
      userId
    );

    const dayOfWeek = dayOfWeekResults.map(r => ({
      day: r.day.trim(),
      amount: Number(r.amount),
      receiptCount: Number(r.receiptCount),
    }));

    const timeOfDay = timeOfDayResults.map(r => ({
      hour: Number(r.hour),
      amount: Number(r.amount),
      receiptCount: Number(r.receiptCount),
    }));

    // Calculate averages and find most/least active days
    const totalAmount = dayOfWeek.reduce((sum, d) => sum + d.amount, 0);
    const averageByDay = dayOfWeek.length > 0 ? totalAmount / dayOfWeek.length : 0;
    
    const mostActiveDay = dayOfWeek.length > 0 ? dayOfWeek[0].day : '';
    const leastActiveDay = dayOfWeek.length > 0 ? dayOfWeek[dayOfWeek.length - 1].day : '';

    const result = {
      dayOfWeek,
      timeOfDay,
      averageByDay,
      mostActiveDay,
      leastActiveDay,
    };

    // Cache the result
    await analyticsCache.set(cacheKey, result);

    return {
      data: result,
      metadata: {
        cached: false,
        queryTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    };
  }

  // Get comprehensive data for export functionality
  async getExportData(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<AnalyticsResponse<{
    receipts: Array<{
      id: string;
      merchant: string;
      total: number;
      purchaseDate: string;
      category: string | null;
      subcategory: string | null;
      summary: string | null;
      confidenceScore: number | null;
    }>;
    summary: {
      totalReceipts: number;
      totalSpent: number;
      averageReceipt: number;
      dateRange: { start: string | null; end: string | null };
    };
  }>> {
    const startTime = Date.now();
    const cacheKey = analyticsCache.generateKey('export-data', { 
      userId, 
      filters: JSON.stringify(filters) 
    });
    
    // Try to get from cache first
    const cached = await analyticsCache.get<{
      receipts: Array<{
        id: string;
        merchant: string;
        total: number;
        purchaseDate: string;
        category: string | null;
        subcategory: string | null;
        summary: string | null;
        confidenceScore: number | null;
      }>;
      summary: {
        totalReceipts: number;
        totalSpent: number;
        averageReceipt: number;
        dateRange: { start: string | null; end: string | null };
      };
    }>(cacheKey);
    if (cached) {
      return {
        data: cached,
        metadata: {
          cached: true,
          queryTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cacheKey,
        },
      };
    }

    const whereClause = this.buildWhereClause(userId, filters);
    
    // Get all receipts with filters
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      select: {
        id: true,
        merchant: true,
        total: true,
        purchaseDate: true,
        category: true,
        subcategory: true,
        summary: true,
        confidenceScore: true,
      },
      orderBy: { purchaseDate: 'desc' },
    });

    // Get summary statistics
    const [aggregate, first, last] = await Promise.all([
      prisma.receipt.aggregate({
        where: whereClause,
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      prisma.receipt.findFirst({ where: whereClause, orderBy: { purchaseDate: 'asc' } }),
      prisma.receipt.findFirst({ where: whereClause, orderBy: { purchaseDate: 'desc' } }),
    ]);

    const result = {
      receipts: receipts.map(r => ({
        id: r.id,
        merchant: r.merchant,
        total: Number(r.total),
        purchaseDate: r.purchaseDate.toISOString().split('T')[0],
        category: r.category,
        subcategory: r.subcategory,
        summary: r.summary,
        confidenceScore: r.confidenceScore ? Number(r.confidenceScore) : null,
      })),
      summary: {
        totalReceipts: aggregate._count,
        totalSpent: Number(aggregate._sum.total ?? 0),
        averageReceipt: Number(aggregate._avg.total ?? 0),
        dateRange: {
          start: first?.purchaseDate.toISOString().split('T')[0] ?? null,
          end: last?.purchaseDate.toISOString().split('T')[0] ?? null,
        },
      },
    };

    // Cache the result
    await analyticsCache.set(cacheKey, result);

    return {
      data: result,
      metadata: {
        cached: false,
        queryTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    };
  }
} 