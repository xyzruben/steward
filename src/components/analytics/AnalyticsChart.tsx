'use client';

// Analytics Chart component for rendering different chart types
// See: Master System Guide - Component Hierarchy, Accessibility and UX

import React from 'react';
import { ChartConfig } from '../../types/analytics';

interface AnalyticsChartProps {
  data: unknown;
  config: ChartConfig;
  type: string;
}

export function AnalyticsChart({ data, config, type }: AnalyticsChartProps) {
  // Transform data based on chart type
  const transformData = () => {
    if (!data) return [];

    switch (type) {
      case 'overview':
        const overviewData = data as { totalSpent?: number; receiptCount?: number; averageReceipt?: number };
        return overviewData ? [
          { metric: 'Total Spent', value: overviewData.totalSpent || 0 },
          { metric: 'Receipt Count', value: overviewData.receiptCount || 0 },
          { metric: 'Average Receipt', value: overviewData.averageReceipt || 0 },
        ] : [];

      case 'trends':
        const trendsData = data as Array<{ period: string; amount: number; receiptCount: number }>;
        return Array.isArray(trendsData) ? trendsData.map((item) => ({
          period: item.period,
          amount: item.amount,
          receiptCount: item.receiptCount,
        })) : [];

      case 'categories':
        const categoriesData = data as Array<{ category: string; amount: number; percentage: number; receiptCount: number }>;
        return Array.isArray(categoriesData) ? categoriesData.map((item) => ({
          category: item.category,
          amount: item.amount,
          percentage: item.percentage,
          receiptCount: item.receiptCount,
        })) : [];

      case 'merchants':
        const merchantsData = data as Array<{ merchant: string; amount: number; receiptCount: number }>;
        return Array.isArray(merchantsData) ? merchantsData.map((item) => ({
          merchant: item.merchant,
          amount: item.amount,
          receiptCount: item.receiptCount,
        })) : [];

      case 'daily-breakdown':
        const dailyData = data as Array<{ date: string; amount: number; receiptCount: number }>;
        return Array.isArray(dailyData) ? dailyData.map((item) => ({
          date: item.date,
          amount: item.amount,
          receiptCount: item.receiptCount,
        })) : [];

      case 'spending-patterns':
        const patternsData = data as { dayOfWeek?: Array<{ day: string; amount: number; receiptCount: number }> };
        return patternsData?.dayOfWeek && Array.isArray(patternsData.dayOfWeek) ? patternsData.dayOfWeek.map((item) => ({
          day: item.day,
          amount: item.amount,
          receiptCount: item.receiptCount,
        })) : [];

      default:
        return [];
    }
  };

  const chartData = transformData();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Render different chart types
  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available for this chart
        </div>
      );
    }

    switch (config.type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'doughnut':
        return renderDoughnutChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderBarChart();
    }
  };

  // Render bar chart
  const renderBarChart = () => {
    const maxValue = Math.max(...chartData.map((item: Record<string, unknown>) => (item[config.valueKey] as number) || 0));
    
    return (
      <div className="space-y-4">
        {chartData.map((item: Record<string, unknown>, index: number) => {
          const value = (item[config.valueKey] as number) || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {item[config.dataKey] as string}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {type === 'categories' ? formatPercentage(value) : formatCurrency(value)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {type === 'trends' && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(item.receiptCount as number) || 0} receipts
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render line chart (simplified as connected bars)
  const renderLineChart = () => {
    return (
      <div className="relative h-64">
        <div className="flex items-end justify-between h-full space-x-2">
          {chartData.map((item: Record<string, unknown>, index: number) => {
            const value = (item[config.valueKey] as number) || 0;
            const maxValue = Math.max(...chartData.map((d: Record<string, unknown>) => (d[config.valueKey] as number) || 0));
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-600 dark:bg-blue-500 rounded-t transition-all duration-300"
                  style={{ height: `${height}%` }}
                />
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                  {item[config.dataKey] as string}
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render pie chart
  const renderPieChart = () => {
    const total = chartData.reduce((sum: number, item: Record<string, unknown>) => sum + ((item[config.valueKey] as number) || 0), 0);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie chart visualization */}
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {chartData.map((item: Record<string, unknown>, index: number) => {
              const value = (item[config.valueKey] as number) || 0;
              const percentage = total > 0 ? (value / total) * 100 : 0;
              const color = config.colorScheme?.[index % (config.colorScheme?.length || 1)] || '#3B82F6';
              
              // Calculate SVG path for pie slice
              const radius = 40;
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = circumference;
              const strokeDashoffset = circumference - (percentage / 100) * circumference;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transformOrigin: '50% 50%',
                    transform: `rotate(${index * 90}deg)`,
                  }}
                />
              );
            })}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {chartData.map((item: Record<string, unknown>, index: number) => {
            const value = (item[config.valueKey] as number) || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const color = config.colorScheme?.[index % (config.colorScheme?.length || 1)] || '#3B82F6';
            
            return (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item[config.dataKey] as string}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(value)} ({formatPercentage(percentage)})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render doughnut chart (similar to pie but with center cutout)
  const renderDoughnutChart = () => {
    return renderPieChart(); // Simplified implementation
  };

  // Render area chart
  const renderAreaChart = () => {
    return (
      <div className="relative h-64">
        <div className="flex items-end justify-between h-full space-x-1">
          {chartData.map((item: Record<string, unknown>, index: number) => {
            const value = (item[config.valueKey] as number) || 0;
            const maxValue = Math.max(...chartData.map((d: Record<string, unknown>) => (d[config.valueKey] as number) || 0));
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 rounded-t transition-all duration-300"
                  style={{ height: `${height}%` }}
                />
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
                  {item[config.dataKey] as string}
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Chart Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {config.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {config.description}
        </p>
      </div>

      {/* Chart Content */}
      <div className="min-h-64">
        {renderChart()}
      </div>

      {/* Chart Footer */}
      {config.showLegend && chartData.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Total: {formatCurrency(chartData.reduce((sum: number, item: Record<string, unknown>) => sum + ((item[config.valueKey] as number) || 0), 0))}
          </div>
        </div>
      )}
    </div>
  );
} 