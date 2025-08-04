import { PrismaClient } from '@prisma/client';
import { parseTimeframe } from '../utils/timeframeParser';

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
  timeframe?: { start: Date; end: Date } | string
}): Promise<{ category: string; total: number; currency: string }> {
  try {
    const whereClause: any = {
      userId: params.userId,
    };

    // Parse timeframe if it's a string
    let timeframe = params.timeframe;
    if (typeof timeframe === 'string') {
      timeframe = parseTimeframe(timeframe);
    }

    // Add date range filter if specified
    if (timeframe) {
      whereClause.purchaseDate = {
        gte: timeframe.start,
        lte: timeframe.end,
      };
    }

    let result;
    
    // If category is specified, use intelligent category matching
    if (params.category) {
      const category = params.category.toLowerCase();
      
      // Use shared category mappings for consistency
      const merchantKeywords = CATEGORY_MAPPINGS[category] || [category];
      
      // MORE PRECISE: Only include receipts that are actually categorized OR have matching merchant names
      // This prevents including unrelated "Uncategorized" receipts
      result = await prisma.receipt.aggregate({
        where: {
          ...whereClause,
          OR: [
            // Exact category match (case insensitive)
            { category: { equals: params.category, mode: 'insensitive' } },
            // Category match with first letter capitalized
            { category: { equals: params.category.charAt(0).toUpperCase() + params.category.slice(1), mode: 'insensitive' } },
            // Merchant name contains any of the category keywords
            ...merchantKeywords.map(keyword => ({
              merchant: { contains: keyword, mode: 'insensitive' }
            }))
          ]
        },
        _sum: {
          total: true,
        },
      });
    } else {
      // No category specified, get all receipts
      result = await prisma.receipt.aggregate({
        where: whereClause,
        _sum: {
          total: true,
        },
      });
    }

    const total = Number(result._sum.total) || 0;
    
    // Debug logging for transparency
    console.log(`🔍 getSpendingByCategory Debug:`, {
      category: params.category,
      timeframe: timeframe,
      total: total,
      merchantKeywords: params.category ? CATEGORY_MAPPINGS[params.category.toLowerCase()] || [params.category] : 'N/A'
    });
    
    return {
      category: params.category || 'all',
      total: total,
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
}): Promise<{ period: { start: Date; end: Date }; total: number; currency: string; count?: number }> {
  const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  // Validate timeframe dates
  if (!params.timeframe.start || !params.timeframe.end) {
    throw new Error('Invalid timeframe: start and end dates are required');
  }
  
  if (!(params.timeframe.start instanceof Date) || !(params.timeframe.end instanceof Date)) {
    throw new Error('Invalid timeframe: start and end must be Date objects');
  }
  
  console.log(`[${queryId}] 🗄️ Database Query Started: getSpendingByTime`, {
    userId: params.userId,
    timeframe: {
      start: params.timeframe.start?.toISOString() || 'undefined',
      end: params.timeframe.end?.toISOString() || 'undefined'
    },
    timestamp: new Date().toISOString()
  });

  try {
    // Add timeout handling for long-running queries
    const queryPromise = prisma.receipt.aggregate({
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
      // Add query optimization hints
      _count: true, // Get count for additional insights
    });

    console.log(`[${queryId}] 🔍 Executing database query...`);

    // Add timeout protection (15 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), 15000);
    });

    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    const executionTime = Date.now() - startTime;

    console.log(`[${queryId}] ✅ Database query completed successfully`, {
      executionTime,
      result: {
        total: Number(result._sum.total) || 0,
        count: result._count || 0
      }
    });

    return {
      period: params.timeframe,
      total: Number(result._sum.total) || 0,
      currency: 'USD',
      count: result._count || 0, // Add count for debugging
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[${queryId}] 💥 Database query failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      executionTime,
      userId: params.userId,
      timeframe: params.timeframe
    });
    
    if (error instanceof Error && error.message === 'Query timeout') {
      throw new Error('Query took too long. Please try a more specific time period.');
    }
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
      // FUZZY MATCHING: Handle multiple variations of vendor names
      const vendorVariations = generateVendorVariations(params.vendor);
      
      whereClause.OR = vendorVariations.map((variation: string) => ({
        merchant: {
          contains: variation,
          mode: 'insensitive'
        }
      }));
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

    const total = Number(result._sum.total) || 0;
    
    // Debug logging for transparency
    console.log(`🔍 getSpendingByVendor Debug:`, {
      vendor: params.vendor,
      timeframe: params.timeframe,
      total: total,
      whereClause: whereClause
    });

    return {
      vendor: params.vendor || 'all',
      total: total,
      currency: 'USD',
    };
  } catch (error) {
    console.error('Error in getSpendingByVendor:', error);
    throw new Error('Failed to retrieve spending by vendor');
  }
}

/**
 * Gets dining and restaurant history for a specific time period.
 * @param params userId, timeframe, optional category
 * @returns dining history with restaurants and amounts
 */
export async function getDiningHistory(params: { 
  userId: string; 
  timeframe: { start: Date; end: Date } | string;
  category?: string;
}): Promise<{ 
  restaurants: Array<{ merchant: string; total: number; count: number; currency: string }>;
  totalSpent: number;
  totalVisits: number;
  currency: string;
  timeframe: { start: Date; end: Date };
}> {
  try {
    // Parse timeframe if it's a string
    let timeframe = params.timeframe;
    if (typeof timeframe === 'string') {
      timeframe = parseTimeframe(timeframe);
    }

    const whereClause: any = {
      userId: params.userId,
      purchaseDate: {
        gte: timeframe.start,
        lte: timeframe.end,
      },
    };

    // Add category filter if specified
    if (params.category) {
      whereClause.category = params.category;
    } else {
      // Default to food-related categories
      whereClause.category = {
        in: ['Food & Dining', 'Restaurants', 'Fast Food', 'Coffee Shops', 'Bars & Pubs']
      };
    }

    // Get all dining receipts for the period
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      select: {
        merchant: true,
        total: true,
        purchaseDate: true,
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    // Group by restaurant
    const restaurantMap = new Map<string, { total: number; count: number }>();
    
    receipts.forEach(receipt => {
      const merchant = receipt.merchant || 'Unknown Restaurant';
      const existing = restaurantMap.get(merchant);
      
      if (existing) {
        existing.total += Number(receipt.total) || 0;
        existing.count += 1;
      } else {
        restaurantMap.set(merchant, {
          total: Number(receipt.total) || 0,
          count: 1,
        });
      }
    });

    // Convert to array and sort by total spent
    const restaurants = Array.from(restaurantMap.entries())
      .map(([merchant, data]) => ({
        merchant,
        total: data.total,
        count: data.count,
        currency: 'USD',
      }))
      .sort((a, b) => b.total - a.total);

    const totalSpent = restaurants.reduce((sum, restaurant) => sum + restaurant.total, 0);
    const totalVisits = restaurants.reduce((sum, restaurant) => sum + restaurant.count, 0);

    return {
      restaurants,
      totalSpent,
      totalVisits,
      currency: 'USD',
      timeframe: timeframe,
    };
  } catch (error) {
    console.error('Error in getDiningHistory:', error);
    throw new Error('Failed to retrieve dining history');
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

/**
 * Category-to-merchant mappings for intelligent categorization.
 * Used by both getSpendingByCategory and categorizeReceipt functions.
 */
const CATEGORY_MAPPINGS: { [key: string]: string[] } = {
  'coffee': ['coffee', 'tierra mia', 'starbucks', 'dunkin', 'peets', 'caribou', 'tim hortons'],
  'food': ['restaurant', 'mcdonalds', 'burger king', 'wendys', 'subway', 'pizza', 'taco', 'chick-fil-a', 'chick fil a'],
  'gas': ['gas', 'shell', 'exxon', 'mobil', 'chevron', 'bp', 'arco'],
  'groceries': ['walmart', 'target', 'kroger', 'safeway', 'albertsons', 'whole foods', 'trader joes'],
  'entertainment': ['netflix', 'spotify', 'amazon prime', 'hulu', 'disney+', 'movie', 'theater']
};

/**
 * Categorizes a receipt based on merchant name using intelligent matching.
 * This function uses the same logic as getSpendingByCategory for consistency.
 * 
 * @param merchantName - The merchant name extracted from the receipt
 * @returns The appropriate category or 'Uncategorized' if no match found
 */
export function categorizeReceipt(merchantName: string): string {
  if (!merchantName || typeof merchantName !== 'string') {
    return 'Uncategorized';
  }

  const merchant = merchantName.toLowerCase().trim();
  
  // Check each category's keywords for matches
  for (const [category, keywords] of Object.entries(CATEGORY_MAPPINGS)) {
    if (keywords.some(keyword => merchant.includes(keyword))) {
      // Return capitalized category name
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  
  return 'Uncategorized';
}

/**
 * Generates multiple variations of a vendor name for fuzzy matching
 * @param vendorName The original vendor name
 * @returns Array of vendor name variations
 */
function generateVendorVariations(vendorName: string): string[] {
  if (!vendorName || typeof vendorName !== 'string') {
    return [];
  }

  const variations: string[] = [];
  const normalized = vendorName.toLowerCase().trim();

  // Add the original name
  variations.push(normalized);

  // Common variations for Chick-fil-A
  if (normalized.includes('chick') && normalized.includes('fil')) {
    variations.push('chick-fil-a');
    variations.push('chick fil a');
    variations.push('chickfila');
    variations.push('chick fil-a');
    variations.push('chick-fil a');
  }

  // Common variations for coffee shops
  if (normalized.includes('tierra') && normalized.includes('mia')) {
    variations.push('tierra mia');
    variations.push('tierra mia coffee');
    variations.push('tierra mia coffee company');
  }

  // Remove duplicates and return
  return [...new Set(variations)];
}