// ============================================================================
// DUPLICATE BADGE COMPONENT
// ============================================================================
// Visual indicator for duplicate receipts
// See: RECEIPT_DUPLICATE_FIX.md - Phase 6

'use client'

import React from 'react'
import { Copy, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface DuplicateBadgeProps {
  isDuplicate: boolean
  duplicateConfidence?: number | { toNumber: () => number } | null
  duplicateOf?: string | null
  variant?: 'compact' | 'full'
  className?: string
  showConfidence?: boolean
}

// ============================================================================
// DUPLICATE BADGE COMPONENT
// ============================================================================

export function DuplicateBadge({
  isDuplicate,
  duplicateConfidence,
  duplicateOf,
  variant = 'full',
  className = '',
  showConfidence = true
}: DuplicateBadgeProps) {
  // Don't render if not a duplicate
  if (!isDuplicate) {
    return null
  }

  // Convert confidence to number
  const confidence = duplicateConfidence
    ? typeof duplicateConfidence === 'number'
      ? duplicateConfidence
      : duplicateConfidence.toNumber()
    : null

  // Determine badge color based on confidence
  const getConfidenceColor = (conf: number | null) => {
    if (!conf) return 'amber'
    if (conf >= 0.90) return 'red'
    if (conf >= 0.80) return 'orange'
    return 'yellow'
  }

  const color = getConfidenceColor(confidence)
  const confidencePercent = confidence ? Math.round(confidence * 100) : null

  // Color classes
  const colorClasses = {
    red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    orange: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    amber: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium border',
          colorClasses[color],
          className
        )}
        title={`Duplicate receipt${confidencePercent ? ` (${confidencePercent}% confidence)` : ''}`}
      >
        <Copy className="w-3 h-3" />
        <span>Duplicate</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border shadow-sm',
        colorClasses[color],
        className
      )}
    >
      <Copy className="w-3.5 h-3.5" />
      <span>Duplicate</span>
      {showConfidence && confidencePercent && (
        <span className="font-semibold">({confidencePercent}%)</span>
      )}
    </div>
  )
}

// ============================================================================
// DUPLICATE WARNING COMPONENT (For high confidence duplicates)
// ============================================================================

interface DuplicateWarningProps {
  confidence: number | { toNumber: () => number }
  className?: string
}

export function DuplicateWarning({ confidence, className = '' }: DuplicateWarningProps) {
  const conf = typeof confidence === 'number' ? confidence : confidence.toNumber()

  // Only show for high confidence duplicates
  if (conf < 0.90) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-start space-x-2 p-3 rounded-lg border bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800',
        className
      )}
    >
      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-xs">
        <p className="font-semibold text-red-900 dark:text-red-300">
          High confidence duplicate ({Math.round(conf * 100)}%)
        </p>
        <p className="text-red-700 dark:text-red-400 mt-1">
          This receipt appears to be a duplicate of an existing receipt. Consider reviewing before processing.
        </p>
      </div>
    </div>
  )
}
