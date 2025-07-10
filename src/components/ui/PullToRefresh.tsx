// ============================================================================
// PULL TO REFRESH COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Mobile-first pull-to-refresh with smooth animations and haptic feedback
// Follows master guide: Component Hierarchy, Performance, Accessibility

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
  disabled?: boolean
}

interface RefreshState {
  isPulling: boolean
  isRefreshing: boolean
  progress: number
}

// ============================================================================
// PULL TO REFRESH COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
  disabled = false
}: PullToRefreshProps) {
  const [refreshState, setRefreshState] = useState<RefreshState>({
    isPulling: false,
    isRefreshing: false,
    progress: 0
  })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const rotate = useTransform(y, [0, threshold], [0, 180])
  const scale = useTransform(y, [0, threshold], [0.8, 1])
  const opacity = useTransform(y, [0, threshold / 2], [0, 1])

  const handleRefresh = async () => {
    if (disabled || refreshState.isRefreshing) return

    setRefreshState(prev => ({ ...prev, isRefreshing: true }))
    
    try {
      await onRefresh()
    } catch (error) {
      console.error('Pull to refresh failed:', error)
    } finally {
      setRefreshState(prev => ({ ...prev, isRefreshing: false }))
    }
  }

  const handleDragStart = () => {
    if (disabled) return
    
    // Check if we're at the top of the scroll
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop
      if (scrollTop > 0) return
    }
    
    setRefreshState(prev => ({ ...prev, isPulling: true }))
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (disabled || !refreshState.isPulling) return
    
    const currentY = info.point.y
    const progress = Math.min(currentY / threshold, 1)
    
    setRefreshState(prev => ({ ...prev, progress }))
    
    // Add haptic feedback when threshold is reached
    if (progress >= 1 && refreshState.progress < 1) {
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled || !refreshState.isPulling) return
    
    const currentY = info.point.y
    
    if (currentY >= threshold) {
      // Trigger refresh
      handleRefresh()
    }
    
    // Reset state
    setRefreshState({ isPulling: false, isRefreshing: false, progress: 0 })
    y.set(0)
  }

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 pointer-events-none z-10"
        style={{ opacity, y: useTransform(y, [0, threshold], [-50, 0]) }}
      >
        <motion.div
          className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-lg border border-slate-200 dark:border-slate-700"
          style={{ scale }}
        >
          <motion.div
            animate={refreshState.isRefreshing ? { rotate: 360 } : {}}
            transition={refreshState.isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          >
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {refreshState.isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="touch-manipulation"
      >
        {children}
      </motion.div>
    </div>
  )
}

// ============================================================================
// INFINITE SCROLL COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface InfiniteScrollProps {
  children: React.ReactNode
  onLoadMore: () => Promise<void>
  hasMore: boolean
  loading: boolean
  className?: string
}

export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  loading,
  className = ''
}: InfiniteScrollProps) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      onLoadMore()
    }
  }, [isIntersecting, hasMore, loading, onLoadMore])

  return (
    <div className={cn('space-y-4', className)}>
      {children}
      
      {hasMore && (
        <motion.div
          className="flex items-center justify-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: loading ? 1 : 0 }}
          onViewportEnter={() => setIsIntersecting(true)}
          onViewportLeave={() => setIsIntersecting(false)}
        >
          {loading && (
            <motion.div
              className="flex items-center space-x-2"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <motion.div
                className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Loading more...
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ============================================================================
// MOBILE SCROLL INDICATOR (see master guide: Component Hierarchy)
// ============================================================================

interface MobileScrollIndicatorProps {
  scrollProgress: number
  className?: string
}

export function MobileScrollIndicator({
  scrollProgress,
  className = ''
}: MobileScrollIndicatorProps) {
  return (
    <motion.div
      className={cn(
        'fixed top-4 right-4 w-2 h-16 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden z-50',
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: scrollProgress > 0.1 ? 1 : 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="w-full bg-blue-600 dark:bg-blue-400 rounded-full"
        style={{ 
          height: `${scrollProgress * 100}%`,
          transformOrigin: 'bottom'
        }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    </motion.div>
  )
} 