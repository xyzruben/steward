// ============================================================================
// ENHANCED RECEIPT STATS COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium receipt statistics with skeleton loading states and smooth transitions
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton, SkeletonGrid } from '@/components/ui/Skeleton'
import { ErrorToast } from '@/components/ui/ErrorToast'
import { AnimatedCard, AnimatedContainer } from '@/components/ui/AnimatedComponents'
import { TrendingUp, TrendingDown, DollarSign, Receipt, Calendar, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, hoverLift } from '@/lib/animations'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface ReceiptStatsProps {
  className?: string
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  loading?: boolean
}

// ============================================================================
// STAT CARD COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color,
  loading = false 
}: StatCardProps) {
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
    <motion.div
      variants={hoverLift}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
    >
      <Card className={cn(
        'transition-all duration-300',
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
            <motion.div 
              className={cn('p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm', colors.icon)}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {icon}
            </motion.div>
          </div>
          
          {change !== undefined && (
            <motion.div 
              className="mt-4 flex items-center space-x-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {changeType === 'increase' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
                >
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                </motion.div>
              ) : changeType === 'decrease' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
                >
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                </motion.div>
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
            </motion.div>
          )}

          {/* Mini chart placeholder */}
          <motion.div 
            className="mt-4 flex items-end space-x-1 h-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[20, 35, 25, 45, 30, 40, 35].map((height, i) => (
              <motion.div
                key={i}
                className={cn(
                  'flex-1 rounded-t',
                  colors.icon.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')
                )}
                style={{ 
                  height: `${height}%`,
                  opacity: 0.3 + (i * 0.1)
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ 
                  delay: 0.5 + (i * 0.05),
                  duration: 0.3,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// MAIN RECEIPT STATS COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function ReceiptStats({ className = '' }: ReceiptStatsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalReceipts: 0,
    averagePerReceipt: 0,
    monthlyGrowth: 0
  })

  // Simulate loading and data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Simulate potential error (1 in 10 chance for demo)
        if (Math.random() < 0.1) {
          throw new Error('Failed to fetch receipt statistics')
        }
        
        setStats({
          totalSpent: 2847.50,
          totalReceipts: 47,
          averagePerReceipt: 60.58,
          monthlyGrowth: 12.5
        })
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'))
        setIsLoading(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const statsData = [
    {
      title: 'Total Spent',
      value: `$${stats.totalSpent.toLocaleString()}`,
      change: stats.monthlyGrowth,
      changeType: (stats.monthlyGrowth > 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'blue' as const
    },
    {
      title: 'Total Receipts',
      value: stats.totalReceipts,
      change: 8.2,
      changeType: 'increase' as const,
      icon: <Receipt className="w-6 h-6" />,
      color: 'green' as const
    },
    {
      title: 'Avg. per Receipt',
      value: `$${stats.averagePerReceipt.toFixed(2)}`,
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
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Receipt Statistics
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {isLoading ? 'Loading your financial insights...' : 'Your spending overview'}
          </p>
        </div>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {statsData.map((stat, index) => (
          <motion.div key={stat.title} variants={staggerItem}>
            <StatCard
              {...stat}
              loading={isLoading}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Loading skeleton for additional content */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton width={200} height={24} />
          <SkeletonGrid count={2} columns={2} variant="stats" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-6">
          <ErrorToast
            type="error"
            title="Failed to load statistics"
            message="Unable to load your receipt statistics. Please try again."
            error={error}
            onRetry={() => {
              setError(null)
              setIsLoading(true)
              // Retry logic would go here
            }}
            autoDismiss={false}
            showErrorDetails={process.env.NODE_ENV === 'development'}
          />
        </div>
      )}
    </div>
  )
} 