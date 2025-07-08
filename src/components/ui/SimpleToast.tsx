// ============================================================================
// SIMPLE TOAST COMPONENT
// ============================================================================
// Simple toast notification for bulk operations
// See: Master System Guide - Frontend Architecture, UI Components

'use client'

import React, { useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface SimpleToastProps {
  type: 'success' | 'error'
  message: string
  onClose: () => void
  duration?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SimpleToast({ 
  type, 
  message, 
  onClose, 
  duration = 5000 
}: SimpleToastProps) {
  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-green-50 border-green-200'
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 flex items-center gap-3 p-4 border rounded-lg shadow-lg
        transition-all duration-300 ease-in-out max-w-sm
        ${getBackgroundColor()}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getIcon()}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600
                 transition-colors duration-200 focus:outline-none focus:ring-2
                 focus:ring-gray-500 rounded"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
} 