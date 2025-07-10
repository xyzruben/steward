// ============================================================================
// ENHANCED LOADING SPINNER COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium loading spinner with multiple variants and smooth animations
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Sparkles, Zap } from 'lucide-react'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'gradient' | 'stepper'
  className?: string
  text?: string
  showIcon?: boolean
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface LoadingPulseProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface LoadingGradientProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface LoadingStepperProps {
  steps?: string[]
  currentStep?: number
  className?: string
}

// ============================================================================
// LOADING DOTS COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

function LoadingDots({ size = 'md', className = '' }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse',
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// LOADING PULSE COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

function LoadingPulse({ size = 'md', className = '' }: LoadingPulseProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'bg-blue-500 rounded-full animate-ping',
          sizeClasses[size]
        )}
        style={{ animationDuration: '1.5s' }}
      />
      <div
        className={cn(
          'absolute inset-0 bg-blue-600 rounded-full',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

// ============================================================================
// LOADING GRADIENT COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

function LoadingGradient({ size = 'md', className = '' }: LoadingGradientProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin',
          sizeClasses[size]
        )}
        style={{ animationDuration: '2s' }}
      />
      <div
        className={cn(
          'absolute inset-1 bg-white dark:bg-slate-800 rounded-full',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

// ============================================================================
// LOADING STEPPER COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

function LoadingStepper({ steps = [], currentStep = 0, className = '' }: LoadingStepperProps) {
  if (steps.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
            index < currentStep 
              ? 'bg-green-500 text-white' 
              : index === currentStep
              ? 'bg-blue-500 text-white animate-pulse'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
          )}>
            {index < currentStep ? '✓' : index + 1}
          </div>
          <span className={cn(
            'text-sm',
            index < currentStep 
              ? 'text-green-600 dark:text-green-400' 
              : index === currentStep
              ? 'text-blue-600 dark:text-blue-400 font-medium'
              : 'text-slate-500 dark:text-slate-400'
          )}>
            {step}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN LOADING SPINNER COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className = '', 
  text,
  showIcon = true
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots size={size} />
      case 'pulse':
        return <LoadingPulse size={size} />
      case 'gradient':
        return <LoadingGradient size={size} />
      case 'stepper':
        return <LoadingStepper steps={['Loading...', 'Processing...', 'Complete']} currentStep={1} />
      default:
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300',
              sizeClasses[size]
            )}
            role="status"
            aria-label="Loading"
          />
        )
    }
  }

  if (variant === 'stepper') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
        <LoadingStepper steps={['Loading...', 'Processing...', 'Complete']} currentStep={1} />
        {text && (
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            {text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center space-x-3', className)}>
      {showIcon && renderSpinner()}
      {text && (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {text}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// FULL SCREEN LOADING COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface FullScreenLoadingProps {
  variant?: 'default' | 'dots' | 'pulse' | 'gradient' | 'stepper'
  text?: string
  showLogo?: boolean
  className?: string
}

export function FullScreenLoading({ 
  variant = 'default', 
  text = 'Loading Steward...',
  showLogo = true,
  className = ''
}: FullScreenLoadingProps) {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
      className
    )}>
      <div className="text-center space-y-6">
        {showLogo && (
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white dark:bg-slate-700 shadow-lg border-2 border-slate-200 dark:border-slate-600">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Steward
            </h1>
          </div>
        )}
        
        <LoadingSpinner 
          variant={variant} 
          size="lg" 
          text={text}
          className="mb-4"
        />
        
        <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3 h-3" />
          <span>AI-powered receipt tracking</span>
          <Zap className="w-3 h-3" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// INLINE LOADING COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface InlineLoadingProps {
  variant?: 'default' | 'dots' | 'pulse'
  size?: 'sm' | 'md'
  text?: string
  className?: string
}

export function InlineLoading({ 
  variant = 'default', 
  size = 'sm',
  text,
  className = ''
}: InlineLoadingProps) {
  return (
    <div className={cn('inline-flex items-center space-x-2', className)}>
      <LoadingSpinner variant={variant} size={size} />
      {text && (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {text}
        </span>
      )}
    </div>
  )
} 