// Analytics types for dashboard and API responses
// See: Master System Guide - TypeScript Standards, API Response Typing

export interface AnalyticsOverview {
  totalSpent: number;
  receiptCount: number;
  averageReceipt: number;
  dateRange: { 
    start: Date | null; 
    end: Date | null; 
  };
}

export interface SpendingTrend {
  period: string; // e.g., '2024-07', '2024-Q2', '2024'
  amount: number;
  receiptCount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  receiptCount: number;
}

export interface MerchantAnalysis {
  merchant: string;
  amount: number;
  receiptCount: number;
}

// Error response types for analytics APIs
export interface AnalyticsErrorResponse {
  error: string;
  details?: string;
}

// Query parameter types for analytics endpoints
export interface AnalyticsQueryParams {
  period?: 'monthly' | 'yearly';
  limit?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  merchant?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Enhanced analytics response with metadata
export interface AnalyticsResponse<T> {
  data: T;
  metadata: {
    cached: boolean;
    queryTime: number; // milliseconds
    timestamp: string;
    cacheKey?: string;
  };
}

// Date range for filtering
export interface DateRange {
  start: Date;
  end: Date;
}

// Analytics filter options
export interface AnalyticsFilters {
  dateRange?: DateRange;
  categories?: string[];
  merchants?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
} 