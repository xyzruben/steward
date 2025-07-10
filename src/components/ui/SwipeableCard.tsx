// ============================================================================
// SWIPEABLE CARD COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Mobile-first swipeable card with dismiss and action gestures
// Follows master guide: Component Hierarchy, Performance, Accessibility

'use client'

import React, { useState, useRef } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AnimatedCard } from './AnimatedComponents'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onDismiss?: () => void
  swipeThreshold?: number
  className?: string
  disabled?: boolean
}

interface SwipeAction {
  direction: 'left' | 'right'
  action: () => void
  threshold: number
  color: string
  icon?: React.ReactNode
}

// ============================================================================
// SWIPEABLE CARD COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onDismiss,
  swipeThreshold = 100,
  className = '',
  disabled = false
}: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const actions: SwipeAction[] = [
    ...(onSwipeLeft ? [{
      direction: 'left',
      action: onSwipeLeft,
      threshold: swipeThreshold,
      color: 'bg-red-500'
    }] : []),
    ...(onSwipeRight ? [{
      direction: 'right',
      action: onSwipeRight,
      threshold: swipeThreshold,
      color: 'bg-green-500'
    }] : []),
    ...(onDismiss ? [{
      direction: 'left',
      action: onDismiss,
      threshold: swipeThreshold * 1.5,
      color: 'bg-red-600'
    }] : [])
  ]

  const handleDragStart = () => {
    if (disabled) return
    setIsDragging(true)
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (disabled) return
    
    const currentX = info.point.x
    const absX = Math.abs(currentX)
    
    // Determine swipe direction
    if (currentX < -50) {
      setSwipeDirection('left')
    } else if (currentX > 50) {
      setSwipeDirection('right')
    } else {
      setSwipeDirection(null)
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled) return
    
    setIsDragging(false)
    const currentX = info.point.x
    const absX = Math.abs(currentX)

    // Find matching action
    const matchingAction = actions.find(action => {
      if (action.direction === 'left' && currentX < -action.threshold) return true
      if (action.direction === 'right' && currentX > action.threshold) return true
      return false
    })

    if (matchingAction) {
      // Execute action with animation
      if (matchingAction.direction === 'left') {
        x.set(-300)
      } else {
        x.set(300)
      }
      
      setTimeout(() => {
        matchingAction.action()
      }, 200)
    } else {
      // Snap back
      x.set(0)
      setSwipeDirection(null)
    }
  }

  if (disabled) {
    return (
      <AnimatedCard className={className}>
        {children}
      </AnimatedCard>
    )
  }

  return (
    <div className="relative">
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
        {actions.map((action, index) => (
          <motion.div
            key={`${action.direction}-${index}`}
            className={cn(
              'flex items-center justify-center w-16 h-16 rounded-full text-white',
              action.color
            )}
            style={{
              opacity: useTransform(x, 
                action.direction === 'left' 
                  ? [-200, -100, 0] 
                  : [0, 100, 200],
                [0, 0.8, 0]
              )
            }}
          >
            {action.icon || (
              <span className="text-sm font-medium">
                {action.direction === 'left' ? '←' : '→'}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Swipeable card */}
      <motion.div
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        className="touch-manipulation"
      >
        <AnimatedCard 
          className={cn(
            'relative z-10',
            isDragging && 'shadow-lg',
            swipeDirection === 'left' && 'border-red-300',
            swipeDirection === 'right' && 'border-green-300',
            className
          )}
        >
          {children}
        </AnimatedCard>
      </motion.div>
    </div>
  )
}

// ============================================================================
// SWIPEABLE LIST ITEM (see master guide: Component Hierarchy)
// ============================================================================

interface SwipeableListItemProps {
  children: React.ReactNode
  onDelete?: () => void
  onEdit?: () => void
  onArchive?: () => void
  className?: string
  disabled?: boolean
}

export function SwipeableListItem({
  children,
  onDelete,
  onEdit,
  onArchive,
  className = '',
  disabled = false
}: SwipeableListItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-200, -100, 0], [0, 1, 1])

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled) return
    
    setIsDragging(false)
    const currentX = info.point.x

    if (currentX < -100) {
      // Swipe left - show actions
      x.set(-120)
    } else {
      // Snap back
      x.set(0)
    }
  }

  const handleAction = (action: () => void) => {
    x.set(-300)
    setTimeout(() => {
      action()
    }, 200)
  }

  if (disabled) {
    return (
      <div className={cn('rounded-md border bg-card p-4', className)}>
        {children}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      <motion.div 
        className="absolute right-0 top-0 bottom-0 flex items-center bg-red-500"
        style={{
          width: useTransform(x, [-200, -100], [120, 60]),
          opacity: useTransform(x, [-200, -50], [1, 0])
        }}
      >
        <div className="flex space-x-2 px-4">
          {onEdit && (
            <motion.button
              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white"
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAction(onEdit)}
            >
              ✏️
            </motion.button>
          )}
          {onArchive && (
            <motion.button
              className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white"
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAction(onArchive)}
            >
              📁
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white"
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAction(onDelete)}
            >
              🗑️
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: -200, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'rounded-md border bg-card p-4 relative z-10 touch-manipulation',
          isDragging && 'shadow-lg',
          className
        )}
      >
        {children}
      </motion.div>
    </div>
  )
} 