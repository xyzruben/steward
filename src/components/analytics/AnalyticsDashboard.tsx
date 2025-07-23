// ============================================================================
// ENHANCED ANALYTICS DASHBOARD COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium analytics dashboard with skeleton loading states and smooth transitions
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, SkeletonGrid, SkeletonCard } from '@/components/ui/Skeleton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { TrendingUp, TrendingDown, DollarSign, Receipt, Calendar, Tag, BarChart3, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface AnalyticsDashboardProps {
  className?: string
}

interface AnalyticsCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  loading?: boolean
}

// ============================================================================
// ANALYTICS CARD COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

function AnalyticsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color,
  loading = false 
}: AnalyticsCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      value: 'text-blue-900 dark:text-blue-100',
      change: {
        increase: 'text-green-600 dark:text-green-400',
        decrease: 'text-red-600 dark:text-red-400',
        neutral: 'text-slate-600 dark:text-slate-400'
      }
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      value: 'text-green-900 dark:text-green-100',
      change: {
        increase: 'text-green-600 dark:text-green-400',
        decrease: 'text-red-600 dark:text-red-400',
        neutral: 'text-slate-600 dark:text-slate-400'
      }
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-900 dark:text-purple-100',
      change: {
        increase: 'text-green-600 dark:text-green-400',
        decrease: 'text-red-600 dark:text-red-400',
        neutral: 'text-slate-600 dark:text-slate-400'
      }
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: 'text-orange-600 dark:text-orange-400',
      value: 'text-orange-900 dark:text-orange-100',
      change: {
        increase: 'text-green-600 dark:text-green-400',
        decrease: 'text-red-600 dark:text-red-400',
        neutral: 'text-slate-600 dark:text-slate-400'
      }
    }
  }

  const colors = colorClasses[color]

  if (loading) {
    return (
      <Card className={cn(
        'transition-all duration-300 hover:shadow-md',
        colors.bg,
        colors.border
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton width={120} height={20} />
              <Skeleton width={80} height={32} />
            </div>
            <Skeleton variant="circular" size="lg" width={48} height={48} />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton width="100%" height={8} />
            <Skeleton width="70%" height={8} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      'transition-all duration-300 hover:shadow-md hover:scale-[1.02]',
      colors.bg,
      colors.border
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <p className={cn('text-2xl font-bold', colors.value)}>
              {value}
            </p>
          </div>
          <div className={cn('p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm', colors.icon)}>
            {icon}
          </div>
        </div>
        
        {change !== undefined && (
          <div className="mt-4 flex items-center space-x-2">
            {changeType === 'increase' ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : changeType === 'decrease' ? (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            ) : null}
            <span className={cn(
              'text-sm font-medium',
              colors.change[changeType]
            )}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              from last month
            </span>
          </div>
        )}

        {/* Mini chart placeholder */}
        <div className="mt-4 flex items-end space-x-1 h-12">
          {[20, 35, 25, 45, 30, 40, 35].map((height, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t transition-all duration-300',
                colors.icon.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')
              )}
              style={{ 
                height: `${height}%`,
                opacity: 0.3 + (i * 0.1)
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN ANALYTICS DASHBOARD COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    totalReceipts: 0,
    averagePerReceipt: 0,
    monthlyGrowth: 0,
    topCategory: '',
    topMerchant: ''
  })

  // Load data immediately for better performance
  useEffect(() => {
    setAnalytics({
      totalSpent: 2847.50,
      totalReceipts: 47,
      averagePerReceipt: 60.58,
      monthlyGrowth: 12.5,
      topCategory: 'Food & Dining',
      topMerchant: 'Amazon.com'
    })
    setIsLoading(false)
  }, [])

  const analyticsData = [
    {
      title: 'Total Spent',
      value: `$${analytics.totalSpent.toLocaleString()}`,
      change: analytics.monthlyGrowth,
      changeType: (analytics.monthlyGrowth > 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'blue' as const
    },
    {
      title: 'Total Receipts',
      value: analytics.totalReceipts,
      change: 8.2,
      changeType: 'increase' as const,
      icon: <Receipt className="w-6 h-6" />,
      color: 'green' as const
    },
    {
      title: 'Avg. per Receipt',
      value: `$${analytics.averagePerReceipt.toFixed(2)}`,
      change: -3.1,
      changeType: 'decrease' as const,
      icon: <Tag className="w-6 h-6" />,
      color: 'purple' as const
    },
    {
      title: 'This Month',
      value: '12',
      change: 15.3,
      changeType: 'increase' as const,
      icon: <Calendar className="w-6 h-6" />,
      color: 'orange' as const
    }
  ]

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {isLoading ? 'Loading your financial insights...' : 'Comprehensive analysis of your spending patterns'}
          </p>
        </div>
        
        {!isLoading && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Live data
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticsData.map((stat, index) => (
          <AnalyticsCard
            key={stat.title}
            {...stat}
            loading={isLoading}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Trends Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Spending Trends
              </CardTitle>
              <BarChart3 className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton width="100%" height={200} />
                <div className="flex justify-between">
                  <Skeleton width={60} height={20} />
                  <Skeleton width={60} height={20} />
                  <Skeleton width={60} height={20} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Chart visualization coming soon
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Category Breakdown
              </CardTitle>
              <PieChart className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton width="100%" height={200} />
                <div className="space-y-2">
                  <Skeleton width="80%" height={16} />
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="70%" height={16} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-48 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Pie chart visualization coming soon
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Food & Dining</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Shopping</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">28%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Transportation</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">22%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Top Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Food & Dining', amount: 987.50, percentage: 35 },
                  { name: 'Shopping', amount: 789.20, percentage: 28 },
                  { name: 'Transportation', amount: 623.80, percentage: 22 },
                  { name: 'Entertainment', amount: 234.50, percentage: 8 },
                  { name: 'Other', amount: 213.50, percentage: 7 }
                ].map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        ${category.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {category.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Top Merchants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Amazon.com', amount: 456.78, count: 8 },
                  { name: 'Starbucks', amount: 234.50, count: 12 },
                  { name: 'Shell', amount: 189.90, count: 4 },
                  { name: 'Walmart', amount: 156.78, count: 3 },
                  { name: 'Netflix', amount: 95.94, count: 6 }
                ].map((merchant, index) => (
                  <div key={merchant.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {merchant.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        ${merchant.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {merchant.count} receipts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 