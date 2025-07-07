'use client';

// Advanced Analytics Filters component
// See: Master System Guide - Component Hierarchy, Accessibility and UX

import React, { useState } from 'react';
import { AnalyticsFilters, AdvancedAnalyticsState } from '../../types/analytics';

interface AdvancedAnalyticsFiltersProps {
  selectedType: AdvancedAnalyticsState['selectedType'];
  period: 'monthly' | 'yearly';
  filters: AnalyticsFilters;
  onTypeChange: (type: AdvancedAnalyticsState['selectedType']) => void;
  onPeriodChange: (period: 'monthly' | 'yearly') => void;
  onFiltersChange: (filters: AnalyticsFilters) => void;
}

export function AdvancedAnalyticsFilters({
  selectedType,
  period,
  filters,
  onTypeChange,
  onPeriodChange,
  onFiltersChange,
}: AdvancedAnalyticsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Analytics type options
  const analyticsTypes = [
    { value: 'overview', label: 'Overview', description: 'Spending summary and key metrics' },
    { value: 'trends', label: 'Trends', description: 'Monthly and yearly spending patterns' },
    { value: 'categories', label: 'Categories', description: 'Spending by category breakdown' },
    { value: 'merchants', label: 'Merchants', description: 'Top spending merchants' },
    { value: 'daily-breakdown', label: 'Daily Breakdown', description: 'Daily spending analysis' },
    { value: 'spending-patterns', label: 'Spending Patterns', description: 'Day of week and time patterns' },
  ] as const;

  // Handle date range change
  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newFilters = { ...filters };
    
    if (!newFilters.dateRange) {
      newFilters.dateRange = { start: new Date(), end: new Date() };
    }
    
    newFilters.dateRange[field] = new Date(value);
    onFiltersChange(newFilters);
  };

  // Handle amount range change
  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    const newFilters = { ...filters };
    
    if (!newFilters.amountRange) {
      newFilters.amountRange = { min: 0, max: 1000 };
    }
    
    newFilters.amountRange[field] = parseFloat(value) || 0;
    onFiltersChange(newFilters);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    const newFilters = { ...filters };
    newFilters.categories = category ? [category] : undefined;
    onFiltersChange(newFilters);
  };

  // Handle merchant change
  const handleMerchantChange = (merchant: string) => {
    const newFilters = { ...filters };
    newFilters.merchants = merchant ? [merchant] : undefined;
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({});
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        {/* Primary Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Analytics Type Selector */}
          <div className="flex-1">
            <label htmlFor="analytics-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Analytics Type
            </label>
            <select
              id="analytics-type"
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value as AdvancedAnalyticsState['selectedType'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {analyticsTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {analyticsTypes.find(t => t.value === selectedType)?.description}
            </p>
          </div>

          {/* Period Selector (only for trends) */}
          {selectedType === 'trends' && (
            <div className="w-full lg:w-48">
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period
              </label>
              <select
                id="period"
                value={period}
                onChange={(e) => onPeriodChange(e.target.value as 'monthly' | 'yearly')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          {/* Expand/Collapse Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              {isExpanded ? 'Hide' : 'Show'} Filters
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters (Expandable) */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="End date"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount Range
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={filters.amountRange?.min || ''}
                    onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Min amount"
                    step="0.01"
                    min="0"
                  />
                  <input
                    type="number"
                    value={filters.amountRange?.max || ''}
                    onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Max amount"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <input
                  id="category-filter"
                  type="text"
                  value={filters.categories?.[0] || ''}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Filter by category"
                />
              </div>

              {/* Merchant Filter */}
              <div>
                <label htmlFor="merchant-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Merchant
                </label>
                <input
                  id="merchant-filter"
                  type="text"
                  value={filters.merchants?.[0] || ''}
                  onChange={(e) => handleMerchantChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Filter by merchant"
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active filters:
                  </span>
                  {filters.dateRange && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      Date: {filters.dateRange.start.toLocaleDateString()} - {filters.dateRange.end.toLocaleDateString()}
                    </span>
                  )}
                  {filters.amountRange && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                      Amount: ${filters.amountRange.min} - ${filters.amountRange.max}
                    </span>
                  )}
                  {filters.categories?.[0] && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                      Category: {filters.categories[0]}
                    </span>
                  )}
                  {filters.merchants?.[0] && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                      Merchant: {filters.merchants[0]}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 