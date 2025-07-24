import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Gets total spending by category for a user in a given timeframe.
 * @param params userId, category, timeframe
 */
export async function getSpendingByCategory(params: { userId: string; category?: string; timeframe?: { start: Date; end: Date } }) {
  // TODO: Implement Prisma query to sum spending by category
  // Example: await prisma.receipt.aggregate(...)
  return {
    category: params.category || 'all',
    total: 0, // TODO: Replace with real sum
    currency: 'USD', // TODO: Make dynamic
  };
}

/**
 * Gets total spending by time period for a user.
 * @param params userId, timeframe
 */
export async function getSpendingByTime(params: { userId: string; timeframe: { start: Date; end: Date } }) {
  // TODO: Implement Prisma query to sum spending in timeframe
  return {
    period: params.timeframe,
    total: 0, // TODO: Replace with real sum
    currency: 'USD',
  };
}

/**
 * Gets total spending by vendor for a user in a given timeframe.
 * @param params userId, vendor, timeframe
 */
export async function getSpendingByVendor(params: { userId: string; vendor?: string; timeframe?: { start: Date; end: Date } }) {
  // TODO: Implement Prisma query to sum spending by vendor
  return {
    vendor: params.vendor || 'all',
    total: 0, // TODO: Replace with real sum
    currency: 'USD',
  };
}

// TODO: Add validation, error handling, and unit tests for each function 