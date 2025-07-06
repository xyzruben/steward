// ============================================================================
// NOTIFICATION TOAST COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - React State Patterns)
// ============================================================================
// Toast notification component for real-time updates
// Follows master guide: Component Testing, Accessibility

'use client'

import React from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

// ============================================================================
// TYPES (see master guide: TypeScript Standards)
// ============================================================================

export interface NotificationToastProps {
  notification: {
    id: string
    type: 'receipt_uploaded' | 'receipt_updated' | 'analytics_updated'
    title: string
    message: string
    timestamp: string
    isRead: boolean
  }
  onClose: (id: string) => void
  onMarkAsRead: (id: string) => void
}

// ============================================================================
// NOTIFICATION TOAST COMPONENT (see master guide: Component Testing)
// ============================================================================

/**
 * Toast notification component for displaying real-time updates
 * Provides accessible, interactive notifications with auto-hide functionality
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Testing, Accessibility
 */
export function NotificationToast({ notification, onClose, onMarkAsRead }: NotificationToastProps) {
  // ============================================================================
  // EVENT HANDLERS (see master guide: React State Patterns)
  // ============================================================================

  const handleClick = () => {
    onMarkAsRead(notification.id)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose(notification.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS (see master guide: Code Quality and Conventions)
  // ============================================================================

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return 'Invalid time'
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'receipt_uploaded':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'receipt_updated':
        return <AlertCircle className="w-5 h-5 text-blue-500" />
      case 'analytics_updated':
        return <Info className="w-5 h-5 text-purple-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  // ============================================================================
  // RENDER (see master guide: Component Testing)
  // ============================================================================

  return (
    <div
      className={`
        relative flex items-start gap-3 p-4 bg-white border rounded-lg shadow-lg
        transition-all duration-200 ease-in-out cursor-pointer
        hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500
        ${notification.isRead ? 'opacity-75' : 'opacity-100'}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${notification.title}: ${notification.message}`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {notification.title}
            </h4>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {notification.message}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              {formatTime(notification.timestamp)}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600
                     transition-colors duration-200 focus:outline-none focus:ring-2
                     focus:ring-gray-500 rounded"
            aria-label="Close notification"
            tabIndex={0}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 