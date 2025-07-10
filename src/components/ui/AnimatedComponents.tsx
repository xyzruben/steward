// ============================================================================
// ANIMATED COMPONENTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Animated component primitives with consistent micro-interactions
// Follows master guide: Component Hierarchy, Performance, Accessibility

'use client'

import React, { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  hoverScale, 
  hoverLift, 
  cardHover, 
  buttonHover, 
  inputFocus,
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  getResponsiveHoverScale,
  getResponsiveCardHover
} from '@/lib/animations'

// ============================================================================
// ANIMATED BUTTON (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    variant = 'default', 
    size = 'md', 
    loading = false,
    className = '',
    children,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    }
    
    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8'
    }

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        variants={getResponsiveHoverScale()}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        disabled={loading}
        tabIndex={0}
        aria-busy={loading}
        aria-pressed={loading}
        touch-action="manipulation"
        {...props}
      >
        {loading ? (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

// ============================================================================
// ANIMATED CARD (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  interactive?: boolean
  className?: string
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    children, 
    interactive = true,
    className = '',
    ...props 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          className
        )}
        variants={interactive ? getResponsiveCardHover() : fadeInUp}
        initial="initial"
        whileHover={interactive ? "hover" : undefined}
        whileTap={interactive ? "tap" : undefined}
        tabIndex={interactive ? 0 : -1}
        touch-action="manipulation"
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'

// ============================================================================
// ANIMATED INPUT (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedInputProps extends HTMLMotionProps<'input'> {
  label?: string
  error?: string
  className?: string
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ 
    label, 
    error,
    className = '',
    ...props 
  }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <motion.label 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {label}
          </motion.label>
        )}
        <motion.input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          variants={inputFocus}
          initial="initial"
          whileFocus="focus"
          {...props}
        />
        {error && (
          <motion.p 
            className="text-sm text-destructive"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

// ============================================================================
// ANIMATED LIST (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedListProps extends HTMLMotionProps<'ul'> {
  children: React.ReactNode
  className?: string
}

export const AnimatedList = forwardRef<HTMLUListElement, AnimatedListProps>(
  ({ 
    children, 
    className = '',
    ...props 
  }, ref) => {
    return (
      <motion.ul
        ref={ref}
        className={cn('space-y-2', className)}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        {...props}
      >
        {children}
      </motion.ul>
    )
  }
)

AnimatedList.displayName = 'AnimatedList'

// ============================================================================
// ANIMATED LIST ITEM (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedListItemProps extends HTMLMotionProps<'li'> {
  children: React.ReactNode
  interactive?: boolean
  className?: string
}

export const AnimatedListItem = forwardRef<HTMLLIElement, AnimatedListItemProps>(
  ({ 
    children, 
    interactive = true,
    className = '',
    ...props 
  }, ref) => {
    return (
      <motion.li
        ref={ref}
        className={cn(
          'rounded-md border bg-card p-4',
          interactive && 'cursor-pointer hover:bg-accent/50',
          className
        )}
        variants={interactive ? getResponsiveCardHover() : staggerItem}
        initial="initial"
        whileHover={interactive ? "hover" : undefined}
        whileTap={interactive ? "tap" : undefined}
        tabIndex={interactive ? 0 : -1}
        touch-action="manipulation"
        {...props}
      >
        {children}
      </motion.li>
    )
  }
)

AnimatedListItem.displayName = 'AnimatedListItem'

// ============================================================================
// ANIMATED CONTAINER (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  animation?: 'fadeIn' | 'fadeInUp' | 'scaleIn' | 'none'
  delay?: number
  className?: string
}

export const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(
  ({ 
    children, 
    animation = 'fadeInUp',
    delay = 0,
    className = '',
    ...props 
  }, ref) => {
    const animations = {
      fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
      fadeInUp,
      scaleIn,
      none: {}
    }

    return (
      <motion.div
        ref={ref}
        className={className}
        variants={animations[animation]}
        initial="initial"
        animate="animate"
        transition={{ delay }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedContainer.displayName = 'AnimatedContainer'

// ============================================================================
// ANIMATED ICON (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedIconProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const AnimatedIcon = forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ 
    children, 
    size = 'md',
    className = '',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex items-center justify-center',
          sizeClasses[size],
          className
        )}
        variants={hoverScale}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedIcon.displayName = 'AnimatedIcon'

// ============================================================================
// ANIMATED BADGE (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedBadgeProps extends HTMLMotionProps<'span'> {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

export const AnimatedBadge = forwardRef<HTMLSpanElement, AnimatedBadgeProps>(
  ({ 
    children, 
    variant = 'default',
    className = '',
    ...props 
  }, ref) => {
    const variantClasses = {
      default: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'text-foreground border border-input'
    }

    return (
      <motion.span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variantClasses[variant],
          className
        )}
        variants={hoverScale}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        {...props}
      >
        {children}
      </motion.span>
    )
  }
)

AnimatedBadge.displayName = 'AnimatedBadge'

// ============================================================================
// ANIMATED LOADING SPINNER (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const AnimatedLoadingSpinner = ({ 
  size = 'md',
  className = ''
}: AnimatedLoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <motion.div
      className={cn(
        'border-2 border-current border-t-transparent rounded-full',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )
}

// ============================================================================
// ANIMATED PROGRESS BAR (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedProgressBarProps {
  progress: number
  className?: string
}

export const AnimatedProgressBar = ({ 
  progress,
  className = ''
}: AnimatedProgressBarProps) => {
  return (
    <div className={cn('w-full bg-secondary rounded-full h-2', className)}>
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

// ============================================================================
// ANIMATED TOGGLE (see master guide: Component Hierarchy)
// ============================================================================

interface AnimatedToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const AnimatedToggle = ({ 
  checked,
  onCheckedChange,
  disabled = false,
  className = ''
}: AnimatedToggleProps) => {
  return (
    <motion.button
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
        className
      )}
      onClick={() => onCheckedChange(!checked)}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
      tabIndex={0}
      role="switch"
      aria-checked={checked}
      aria-pressed={checked}
      touch-action="manipulation"
    >
      <motion.span
        className="inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition-transform"
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  )
} 