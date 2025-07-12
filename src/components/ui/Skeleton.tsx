// ============================================================================
// SKELETON COMPONENT SYSTEM (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium skeleton loading states with multiple variants and animations
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular' | 'card' | 'avatar'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  width?: string | number
  height?: string | number
  className?: string
  animate?: boolean
}

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'receipt' | 'stats' | 'notification' | 'upload' | 'card'
  lines?: number
  showAvatar?: boolean
  showImage?: boolean
  className?: string
}

// ============================================================================
// BASE SKELETON COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function Skeleton({ 
  variant = 'default', 
  size = 'md', 
  width, 
  height, 
  className = '', 
  animate = true,
  ...props 
}: SkeletonProps) {
  const sizeClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8'
  }

  const variantClasses = {
    default: 'rounded',
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-lg',
    avatar: 'rounded-full'
  }

  const baseClasses = cn(
    'bg-slate-200 dark:bg-slate-700',
    variantClasses[variant],
    sizeClasses[size],
    animate && 'animate-pulse',
    className
  )

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div 
      className={baseClasses}
      style={style}
      data-testid="skeleton"
      {...props}
    />
  )
}

// ============================================================================
// SKELETON CARD COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function SkeletonCard({ 
  variant = 'default', 
  lines = 3, 
  showAvatar = false, 
  showImage = false,
  className = '',
  ...props 
}: SkeletonCardProps) {
  const cardVariants = {
    default: 'p-4 space-y-3',
    receipt: 'p-4 space-y-4',
    stats: 'p-6 space-y-4',
    notification: 'p-4 space-y-3',
    upload: 'p-6 space-y-4',
    card: 'p-4 space-y-3'
  }

  const renderContent = () => {
    switch (variant) {
      case 'receipt':
        return (
          <>
            {showImage && (
              <div className="flex items-center space-x-3">
                <Skeleton variant="rectangular" width={60} height={60} className="rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Skeleton width="80%" />
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <Skeleton width={80} height={24} />
              <Skeleton width={60} height={24} />
            </div>
          </>
        )

      case 'stats':
        return (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton width={120} height={32} />
                <Skeleton width={80} />
              </div>
              <Skeleton variant="circular" size="lg" width={48} height={48} />
            </div>
            <div className="space-y-2">
              <Skeleton width="100%" />
              <Skeleton width="90%" />
              <Skeleton width="70%" />
            </div>
            <div className="flex justify-center pt-2">
              <Skeleton width={64} height={32} />
            </div>
          </>
        )

      case 'notification':
        return (
          <>
            <div className="flex items-start space-x-3">
              <Skeleton variant="circular" size="sm" width={20} height={20} />
              <div className="flex-1 space-y-2">
                <Skeleton width="70%" />
                <Skeleton width="90%" />
                <Skeleton width="50%" />
              </div>
            </div>
          </>
        )

      case 'upload':
        return (
          <>
            <div className="text-center space-y-4">
              <Skeleton variant="circular" size="xl" width={64} height={64} className="mx-auto" />
              <div className="space-y-2">
                <Skeleton width="60%" className="mx-auto" />
                <Skeleton width="80%" className="mx-auto" />
              </div>
              <div className="space-y-2">
                <Skeleton width="100%" height={8} />
                <div className="flex justify-between text-xs text-slate-500">
                  <Skeleton width={60} height={12} />
                  <Skeleton width={40} height={12} />
                </div>
              </div>
            </div>
          </>
        )

      default:
        return (
          <>
            {showAvatar && (
              <div className="flex items-center space-x-3">
                <Skeleton variant="avatar" size="md" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              {Array.from({ length: lines }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  width={i === lines - 1 ? '60%' : '100%'} 
                />
              ))}
            </div>
          </>
        )
    }
  }

  return (
    <div 
      className={cn(
        'bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700',
        cardVariants[variant],
        className
      )}
      data-testid="skeleton-card"
      {...props}
    >
      {renderContent()}
    </div>
  )
}

// ============================================================================
// SKELETON LIST COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
  variant?: 'default' | 'receipt' | 'notification'
  className?: string
}

export function SkeletonList({ 
  count = 3, 
  variant = 'default', 
  className = '',
  ...props 
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-4', className)} data-testid="skeleton-list" {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard 
          key={i} 
          variant={variant}
          className="animate-pulse"
          style={{ 
            animationDelay: `${i * 100}ms`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// SKELETON GRID COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface SkeletonGridProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
  columns?: number
  variant?: 'default' | 'stats' | 'card'
  className?: string
}

export function SkeletonGrid({ 
  count = 4, 
  columns = 2, 
  variant = 'default',
  className = '',
  ...props 
}: SkeletonGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div 
      className={cn(
        'grid gap-4',
        gridCols[columns as keyof typeof gridCols] || gridCols[2],
        className
      )} 
      data-testid="skeleton-grid"
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard 
          key={i} 
          variant={variant}
          className="animate-pulse"
          style={{ 
            animationDelay: `${i * 50}ms`,
            animationDuration: '1.2s'
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// SKELETON TABLE COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className = '',
  ...props 
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-2', className)} data-testid="skeleton-table" {...props}>
      {showHeader && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="80%" />
          ))}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div 
            key={rowIndex}
            className="grid grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            style={{ 
              animationDelay: `${rowIndex * 100}ms`,
              animationDuration: '1.5s'
            }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                width={colIndex === 0 ? '90%' : '70%'} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON DASHBOARD COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface SkeletonDashboardProps extends React.HTMLAttributes<HTMLDivElement> {
  showStats?: boolean
  showReceipts?: boolean
  showUpload?: boolean
  className?: string
}

export function SkeletonDashboard({ 
  showStats = true,
  showReceipts = true,
  showUpload = true,
  className = '',
  ...props 
}: SkeletonDashboardProps) {
  return (
    <div className={cn('space-y-8', className)} data-testid="skeleton-dashboard" {...props}>
      {/* Stats Section */}
      {showStats && (
        <div className="space-y-4" data-testid="skeleton-stats">
          <div className="flex items-center justify-between">
            <Skeleton width={200} height={28} />
            <Skeleton width={100} height={20} />
          </div>
          <SkeletonGrid count={4} columns={4} variant="stats" />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {showReceipts && (
            <div className="space-y-4" data-testid="skeleton-receipts">
              <Skeleton width={150} height={24} />
              <SkeletonList count={3} variant="receipt" />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {showUpload && (
            <div data-testid="skeleton-upload">
              <SkeletonCard variant="upload" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 