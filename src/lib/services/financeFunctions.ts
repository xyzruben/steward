import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for better type safety
interface SpendingResult {
  total: number;
  currency: string;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  currency: string;
}

interface VendorBreakdown {
  vendor: string;
  total: number;
  currency: string;
}

interface SpendingAnomaly {
  type: 'outlier' | 'new_vendor' | 'high_amount' | 'category_spike';
  entity: 'transaction' | 'category' | 'vendor';
  id: string;
  amount: number;
  currency: string;
  reason: string;
  details: Record<string, any>;
}

interface TrendPoint {
  date: string;
  total: number;
  currency: string;
}

/**
 * Gets total spending by category for a user in a given timeframe.
 * @param params userId, category, timeframe
 */
export async function getSpendingByCategory(params: { 
  userId: string; 
  category?: string; 
  timeframe?: { start: Date; end: Date } 
}): Promise<{ category: string; total: number; currency: string }> {
  try {
    const whereClause: any = {
      userId: params.userId,
    };

    // Add category filter if specified
    if (params.category) {
      whereClause.category = params.category;
    }

    // Add date range filter if specified
    if (params.timeframe) {
      whereClause.purchaseDate = {
        gte: params.timeframe.start,
        lte: params.timeframe.end,
      };
    }

    const result = await prisma.receipt.aggregate({
      where: whereClause,
      _sum: {
        total: true,
      },
    });

    return {
      category: params.category || 'all',
      total: Number(result._sum.total) || 0,
      currency: 'USD', // TODO: Get from user preferences
    };
  } catch (error) {
    console.error('Error in getSpendingByCategory:', error);
    throw new Error('Failed to retrieve spending by category');
  }
}

/**
 * Gets total spending by time period for a user.
 * @param params userId, timeframe
 */
export async function getSpendingByTime(params: { 
  userId: string; 
  timeframe: { start: Date; end: Date } 
}): Promise<{ period: { start: Date; end: Date }; total: number; currency: string }> {
  try {
    const result = await prisma.receipt.aggregate({
      where: {
        userId: params.userId,
        purchaseDate: {
          gte: params.timeframe.start,
          lte: params.timeframe.end,
        },
      },
      _sum: {
        total: true,
      },
    });

    return {
      period: params.timeframe,
      total: Number(result._sum.total) || 0,
      currency: 'USD',
    };
  } catch (error) {
    console.error('Error in getSpendingByTime:', error);
    throw new Error('Failed to retrieve spending by time period');
  }
}

/**
 * Gets total spending by vendor for a user in a given timeframe.
 * @param params userId, vendor, timeframe
 */
export async function getSpendingByVendor(params: { 
  userId: string; 
  vendor?: string; 
  timeframe?: { start: Date; end: Date } 
}): Promise<{ vendor: string; total: number; currency: string }> {
  try {
    const whereClause: any = {
      userId: params.userId,
    };

    // Add vendor filter if specified
    if (params.vendor) {
      whereClause.merchant = params.vendor;
    }

    // Add date range filter if specified
    if (params.timeframe) {
      whereClause.purchaseDate = {
        gte: params.timeframe.start,
        lte: params.timeframe.end,
      };
    }

    const result = await prisma.receipt.aggregate({
      where: whereClause,
      _sum: {
        total: true,
      },
    });

    return {
      vendor: params.vendor || 'all',
      total: Number(result._sum.total) || 0,
      currency: 'USD',
    };
  } catch (error) {
    console.error('Error in getSpendingByVendor:', error);
    throw new Error('Failed to retrieve spending by vendor');
  }
}

/**
 * Gets total spending and breakdown by category for a custom period.
 * @param params userId, timeframe (start, end)
 * @returns total spending, breakdown by category
 */
export async function getSpendingForCustomPeriod(params: { 
  userId: string; 
  timeframe: { start: Date; end: Date } 
}): Promise<{ 
  period: { start: Date; end: Date }; 
  total: number; 
  breakdown: CategoryBreakdown[]; 
  currency: string 
}> {
  try {
    // Get total spending for the period
    const totalResult = await prisma.receipt.aggregate({
      where: {
        userId: params.userId,
        purchaseDate: {
          gte: params.timeframe.start,
          lte: params.timeframe.end,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Get breakdown by category
    const breakdownResult = await prisma.receipt.groupBy({
      by: ['category'],
      where: {
        userId: params.userId,
        purchaseDate: {
          gte: params.timeframe.start,
          lte: params.timeframe.end,
        },
        category: {
          not: null,
        },
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
    });

    const breakdown: CategoryBreakdown[] = breakdownResult.map((item) => ({
      category: item.category || 'Uncategorized',
      total: Number(item._sum.total) || 0,
      currency: 'USD',
    }));

    return {
      period: params.timeframe,
      total: Number(totalResult._sum.total) || 0,
      breakdown,
      currency: 'USD',
    };
  } catch (error) {
    console.error('Error in getSpendingForCustomPeriod:', error);
    throw new Error('Failed to retrieve spending breakdown for custom period');
  }
}

/**
 * Compares spending between two periods (optionally by category/vendor).
 * @param params userId, periodA, periodB, optional category/vendor
 * @returns totals for each period and the difference
 */
export async function getSpendingComparison(params: {
  userId: string;
  periodA: { start: Date; end: Date };
  periodB: { start: Date; end: Date };
  category?: string;
  vendor?: string;
}): Promise<{
  periodA: { range: { start: Date; end: Date }; total: number };
  periodB: { range: { start: Date; end: Date }; total: number };
  difference: number;
  currency: string;
}> {
  try {
    const baseWhereClause: any = {
      userId: params.userId,
    };

    // Add optional filters
    if (params.category) {
      baseWhereClause.category = params.category;
    }
    if (params.vendor) {
      baseWhereClause.merchant = params.vendor;
    }

    // Get spending for period A
    const periodAResult = await prisma.receipt.aggregate({
      where: {
        ...baseWhereClause,
        purchaseDate: {
          gte: params.periodA.start,
          lte: params.periodA.end,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Get spending for period B
    const periodBResult = await prisma.receipt.aggregate({
      where: {
        ...baseWhereClause,
        purchaseDate: {
          gte: params.periodB.start,
          lte: params.periodB.end,
        },
      },
      _sum: {
        total: true,
      },
    });

    const periodATotal = Number(periodAResult._sum.total) || 0;
    const periodBTotal = Number(periodBResult._sum.total) || 0;
    const difference = periodBTotal - periodATotal;

    return {
      periodA: {
        range: params.periodA,
        total: periodATotal,
      },
      periodB: {
        range: params.periodB,
        total: periodBTotal,
      },
      difference,
      currency: 'USD',
    };
  } catch (error) {
    console.error('Error in getSpendingComparison:', error);
    throw new Error('Failed to compare spending between periods');
  }
}

/**
 * Detects spending anomalies for a user in a given timeframe.
 * Flags transactions or categories that are unusual (e.g., high amount, new vendor, outlier vs. historical average).
 * @param params userId, timeframe, optional category/vendor
 * @returns Array of anomalies with reason and details
 */
export async function detectSpendingAnomalies(params: {
  userId: string;
  timeframe: { start: Date; end: Date };
  category?: string;
  vendor?: string;
}): Promise<SpendingAnomaly[]> {
  try {
    const anomalies: SpendingAnomaly[] = [];

    // Get historical average spending (last 3 months before the timeframe)
    const historicalStart = new Date(params.timeframe.start);
    historicalStart.setMonth(historicalStart.getMonth() - 3);
    
    const historicalResult = await prisma.receipt.aggregate({
      where: {
        userId: params.userId,
        purchaseDate: {
          gte: historicalStart,
          lt: params.timeframe.start,
        },
        ...(params.category && { category: params.category }),
        ...(params.vendor && { merchant: params.vendor }),
      },
      _avg: {
        total: true,
      },
      _count: true,
    });

    const historicalAverage = Number(historicalResult._avg.total) || 0;
    const historicalCount = historicalResult._count || 0;

    // Get current period transactions
    const currentTransactions = await prisma.receipt.findMany({
      where: {
        userId: params.userId,
        purchaseDate: {
          gte: params.timeframe.start,
          lte: params.timeframe.end,
        },
        ...(params.category && { category: params.category }),
        ...(params.vendor && { merchant: params.vendor }),
      },
      orderBy: {
        total: 'desc',
      },
      take: 10, // Check top 10 transactions for anomalies
    });

    // Detect high amount anomalies (transactions > 2x historical average)
    if (historicalAverage > 0) {
      const highAmountThreshold = historicalAverage * 2;
      
      for (const transaction of currentTransactions) {
        if (Number(transaction.total) > highAmountThreshold) {
          anomalies.push({
            type: 'high_amount',
            entity: 'transaction',
            id: transaction.id,
            amount: Number(transaction.total),
            currency: transaction.currency,
            reason: `Unusually high amount ($${Number(transaction.total).toFixed(2)}) compared to your average of $${historicalAverage.toFixed(2)}`,
            details: {
              merchant: transaction.merchant,
              category: transaction.category,
              purchaseDate: transaction.purchaseDate,
              historicalAverage,
              threshold: highAmountThreshold,
            },
          });
        }
      }
    }

    // Detect new vendors (vendors not seen in historical data)
    if (historicalCount > 0) {
      const historicalVendors = await prisma.receipt.findMany({
        where: {
          userId: params.userId,
          purchaseDate: {
            gte: historicalStart,
            lt: params.timeframe.start,
          },
        },
        select: {
          merchant: true,
        },
        distinct: ['merchant'],
      });

      const historicalVendorSet = new Set(historicalVendors.map(v => v.merchant));
      
      for (const transaction of currentTransactions) {
        if (!historicalVendorSet.has(transaction.merchant)) {
          anomalies.push({
            type: 'new_vendor',
            entity: 'vendor',
            id: transaction.id,
            amount: Number(transaction.total),
            currency: transaction.currency,
            reason: `New vendor detected: ${transaction.merchant}`,
            details: {
              merchant: transaction.merchant,
              category: transaction.category,
              purchaseDate: transaction.purchaseDate,
            },
          });
        }
      }
    }

    return anomalies;
  } catch (error) {
    console.error('Error in detectSpendingAnomalies:', error);
    throw new Error('Failed to detect spending anomalies');
  }
}

/**
 * Returns time series data for spending trends (e.g., daily, weekly, monthly totals).
 * @param params userId, timeframe, optional category/vendor
 * @returns Array of { date, total, currency }
 */
export async function getSpendingTrends(params: {
  userId: string;
  timeframe: { start: Date; end: Date };
  category?: string;
  vendor?: string;
  interval?: 'day' | 'week' | 'month';
}): Promise<TrendPoint[]> {
  try {
    const interval = params.interval || 'day';
    
    // Build where clause
    const whereClause: any = {
      userId: params.userId,
      purchaseDate: {
        gte: params.timeframe.start,
        lte: params.timeframe.end,
      },
    };

    if (params.category) {
      whereClause.category = params.category;
    }
    if (params.vendor) {
      whereClause.merchant = params.vendor;
    }

    // For now, we'll group by date and aggregate
    // In a production environment, you might want to use database-specific date functions
    const results = await prisma.receipt.groupBy({
      by: ['purchaseDate'],
      where: whereClause,
      _sum: {
        total: true,
      },
      orderBy: {
        purchaseDate: 'asc',
      },
    });

    return results.map((result) => ({
      date: result.purchaseDate.toISOString().split('T')[0], // YYYY-MM-DD format
      total: Number(result._sum.total) || 0,
      currency: 'USD',
    }));
  } catch (error) {
    console.error('Error in getSpendingTrends:', error);
    throw new Error('Failed to retrieve spending trends');
  }
}

/**
 * Returns top N vendors by total spending for a user in a given timeframe.
 * @param params userId, timeframe, N
 * @returns Array of { vendor, total, currency }
 */
export async function summarizeTopVendors(params: {
  userId: string;
  timeframe: { start: Date; end: Date };
  N: number;
}): Promise<VendorBreakdown[]> {
  try {
    const results = await prisma.receipt.groupBy({
      by: ['merchant'],
      where: {
        userId: params.userId,
        purchaseDate: {
          gte: params.timeframe.start,
          lte: params.timeframe.end,
        },
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: params.N,
    });

    return results.map((result) => ({
      vendor: result.merchant,
      total: Number(result._sum.total) || 0,
      currency: 'USD',
    }));
  } catch (error) {
    console.error('Error in summarizeTopVendors:', error);
    throw new Error('Failed to retrieve top vendors summary');
  }
}

/**
 * Returns top N categories by total spending for a user in a given timeframe.
 * @param params userId, timeframe, N
 * @returns Array of { category, total, currency }
 */
export async function summarizeTopCategories(params: {
  userId: string;
  timeframe: { start: Date; end: Date };
  N: number;
}): Promise<CategoryBreakdown[]> {
  try {
    const results = await prisma.receipt.groupBy({
      by: ['category'],
      where: {
        userId: params.userId,
        purchaseDate: {
          gte: params.timeframe.start,
          lte: params.timeframe.end,
        },
        category: {
          not: null,
        },
      },
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: params.N,
    });

    return results.map((result) => ({
      category: result.category || 'Uncategorized',
      total: Number(result._sum.total) || 0,
      currency: 'USD',
    }));
  } catch (error) {
    console.error('Error in summarizeTopCategories:', error);
    throw new Error('Failed to retrieve top categories summary');
  }
} 