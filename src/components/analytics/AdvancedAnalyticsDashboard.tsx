'use client';

// Advanced Analytics Dashboard component
// See: Master System Guide - Frontend Architecture, Component Hierarchy, State Management

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AnalyticsFilters, AdvancedAnalyticsState, ChartConfig } from '../../types/analytics';
import { AdvancedAnalyticsFilters } from './AdvancedAnalyticsFilters';
import { AnalyticsChart } from './AnalyticsChart';
import { AnalyticsExport } from './AnalyticsExport';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { NotificationToast } from '../ui/NotificationToast';

export function AdvancedAnalyticsDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState<AdvancedAnalyticsState>({
    selectedType: 'overview',
    period: 'monthly',
    filters: {},
    isLoading: false,
    error: null,
    data: null,
    metadata: null,
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Chart configurations for different analytics types
  const chartConfigs: Record<string, ChartConfig> = {
    overview: {
      type: 'bar',
      title: 'Spending Overview',
      description: 'Total spending and receipt count summary',
      dataKey: 'metric',
      valueKey: 'value',
      showLegend: true,
      showGrid: true,
    },
    trends: {
      type: 'line',
      title: 'Spending Trends',
      description: 'Monthly or yearly spending patterns',
      dataKey: 'period',
      valueKey: 'amount',
      showLegend: true,
      showGrid: true,
    },
    categories: {
      type: 'pie',
      title: 'Category Breakdown',
      description: 'Spending distribution by category',
      dataKey: 'category',
      valueKey: 'amount',
      showLegend: true,
      colorScheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
    },
    merchants: {
      type: 'bar',
      title: 'Top Merchants',
      description: 'Highest spending merchants',
      dataKey: 'merchant',
      valueKey: 'amount',
      showLegend: false,
      showGrid: true,
    },
    'daily-breakdown': {
      type: 'area',
      title: 'Daily Spending',
      description: 'Daily spending patterns over time',
      dataKey: 'date',
      valueKey: 'amount',
      showLegend: true,
      showGrid: true,
    },
    'spending-patterns': {
      type: 'bar',
      title: 'Spending Patterns',
      description: 'Day of week and time of day analysis',
      dataKey: 'day',
      valueKey: 'amount',
      showLegend: true,
      showGrid: true,
    },
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({
        type: state.selectedType,
        period: state.period,
      });

      // Add filters to query params
      if (state.filters.dateRange) {
        params.append('startDate', state.filters.dateRange.start.toISOString());
        params.append('endDate', state.filters.dateRange.end.toISOString());
      }
      if (state.filters.categories?.length) {
        params.append('category', state.filters.categories[0]);
      }
      if (state.filters.merchants?.length) {
        params.append('merchant', state.filters.merchants[0]);
      }
      if (state.filters.amountRange) {
        params.append('minAmount', state.filters.amountRange.min.toString());
        params.append('maxAmount', state.filters.amountRange.max.toString());
      }

      const response = await fetch(`/api/analytics/advanced?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setState(prev => ({
        ...prev,
        data: result.data,
        metadata: result.metadata,
        isLoading: false,
      }));

      setNotification({
        type: 'success',
        message: `Analytics data loaded successfully (${result.metadata.queryTime}ms)`,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      }));
      
      setNotification({
        type: 'error',
        message: 'Failed to load analytics data',
      });
    }
  }, [user, state.selectedType, state.period, state.filters]);

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle analytics type change
  const handleTypeChange = (type: AdvancedAnalyticsState['selectedType']) => {
    setState(prev => ({ ...prev, selectedType: type }));
  };

  // Handle period change
  const handlePeriodChange = (period: 'monthly' | 'yearly') => {
    setState(prev => ({ ...prev, period }));
  };

  // Handle filters change
  const handleFiltersChange = (filters: AnalyticsFilters) => {
    setState(prev => ({ ...prev, filters }));
  };

  // Handle export
  const handleExport = async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const params = new URLSearchParams({
        type: 'export-data',
      });

      // Add current filters to export
      if (state.filters.dateRange) {
        params.append('startDate', state.filters.dateRange.start.toISOString());
        params.append('endDate', state.filters.dateRange.end.toISOString());
      }
      if (state.filters.categories?.length) {
        params.append('category', state.filters.categories[0]);
      }
      if (state.filters.merchants?.length) {
        params.append('merchant', state.filters.merchants[0]);
      }
      if (state.filters.amountRange) {
        params.append('minAmount', state.filters.amountRange.min.toString());
        params.append('maxAmount', state.filters.amountRange.max.toString());
      }

      const response = await fetch(`/api/analytics/advanced?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Create and download CSV
      const csvContent = convertToCSV(result.data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `steward-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setNotification({
        type: 'success',
        message: 'Analytics data exported successfully',
      });
    } catch (error) {
      console.error('Failed to export analytics:', error);
      setNotification({
        type: 'error',
        message: 'Failed to export analytics data',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data: unknown) => {
    if (!data || typeof data !== 'object' || !('receipts' in data)) return '';

    const receipts = (data as { receipts: Array<Record<string, unknown>> }).receipts;
    const headers = ['Date', 'Merchant', 'Amount', 'Category', 'Subcategory', 'Summary', 'Confidence Score'];
    const rows = receipts.map((receipt) => [
      receipt.purchaseDate as string,
      receipt.merchant as string,
      receipt.total as number,
      receipt.category as string || '',
      receipt.subcategory as string || '',
      receipt.summary as string || '',
      receipt.confidenceScore as number || '',
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500">Please log in to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Deep insights into your spending patterns and trends
          </p>
        </div>
        
        <AnalyticsExport onExport={handleExport} isLoading={state.isLoading} />
      </div>

      {/* Filters */}
      <AdvancedAnalyticsFilters
        selectedType={state.selectedType}
        period={state.period}
        filters={state.filters}
        onTypeChange={handleTypeChange}
        onPeriodChange={handlePeriodChange}
        onFiltersChange={handleFiltersChange}
      />

      {/* Analytics Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {state.isLoading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : state.error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{state.error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : state.data ? (
          <div className="p-6">
            <AnalyticsChart
              data={state.data}
              config={chartConfigs[state.selectedType]}
              type={state.selectedType}
            />
            
            {/* Metadata */}
            {state.metadata && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    Query time: {(state.metadata as { queryTime: number }).queryTime}ms
                    {(state.metadata as { cached: boolean }).cached && ' (cached)'}
                  </span>
                  <span>
                    Last updated: {new Date((state.metadata as { timestamp: string }).timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No data available
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <NotificationToast
          notification={{
            id: `analytics-${Date.now()}`,
            type: notification.type === 'success' ? 'receipt_uploaded' : 
                  notification.type === 'error' ? 'receipt_updated' : 'analytics_updated',
            title: notification.type === 'success' ? 'Success' : 
                   notification.type === 'error' ? 'Error' : 'Info',
            message: notification.message,
            timestamp: new Date().toISOString(),
            isRead: false,
          }}
          onClose={() => setNotification(null)}
          onMarkAsRead={() => setNotification(null)}
        />
      )}
    </div>
  );
} 