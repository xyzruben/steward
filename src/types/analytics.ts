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

// Daily breakdown for detailed spending analysis
export interface DailyBreakdown {
  date: string;
  amount: number;
  receiptCount: number;
}

// Spending patterns analysis
export interface SpendingPatterns {
  dayOfWeek: Array<{ day: string; amount: number; receiptCount: number }>;
  timeOfDay: Array<{ hour: number; amount: number; receiptCount: number }>;
  averageByDay: number;
  mostActiveDay: string;
  leastActiveDay: string;
}

// Export data structure
export interface ExportData {
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
}

// Advanced analytics dashboard state
export interface AdvancedAnalyticsState {
  selectedType: 'overview' | 'trends' | 'categories' | 'merchants' | 'daily-breakdown' | 'spending-patterns';
  period: 'monthly' | 'yearly';
  filters: AnalyticsFilters;
  isLoading: boolean;
  error: string | null;
  data: unknown;
  metadata: {
    cached: boolean;
    queryTime: number;
    timestamp: string;
    cacheKey?: string;
  } | null;
}

// Chart configuration for different analytics types
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  title: string;
  description: string;
  dataKey: string;
  valueKey: string;
  colorScheme?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
} 