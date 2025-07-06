// ============================================================================
// REALTIME NOTIFICATIONS COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Displays real-time notifications for receipt uploads and analytics updates
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import { useState, useEffect } from 'react'
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useRealtime, type RealtimeNotification } from '@/hooks/useRealtime'

// ============================================================================
// COMPONENT INTERFACE (see master guide: TypeScript Standards)
// ============================================================================

interface RealtimeNotificationsProps {
  maxNotifications?: number
  autoHideDuration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

// ============================================================================
// NOTIFICATION ITEM COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

interface NotificationItemProps {
  notification: RealtimeNotification
  onDismiss: (id: string) => void
  autoHideDuration?: number
}

function NotificationItem({ notification, onDismiss, autoHideDuration = 5000 }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Auto-hide notification after duration
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss(notification.data.timestamp), 300) // Allow animation to complete
      }, autoHideDuration)

      return () => clearTimeout(timer)
    }
  }, [autoHideDuration, onDismiss, notification.data.timestamp])

  // Get icon and styling based on notification type
  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'receipt_uploaded':
        return {
          icon: <Info className="h-5 w-5 text-blue-600" />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-700',
          textColor: 'text-blue-800 dark:text-blue-200',
        }
      case 'receipt_processed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-700',
          textColor: 'text-green-800 dark:text-green-200',
        }
      case 'analytics_updated':
        return {
          icon: <AlertCircle className="h-5 w-5 text-purple-600" />,
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-700',
          textColor: 'text-purple-800 dark:text-purple-200',
        }
      default:
        return {
          icon: <Bell className="h-5 w-5 text-slate-600" />,
          bgColor: 'bg-slate-50 dark:bg-slate-900/20',
          borderColor: 'border-slate-200 dark:border-slate-700',
          textColor: 'text-slate-800 dark:text-slate-200',
        }
    }
  }

  const style = getNotificationStyle()

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`
        ${style.bgColor} ${style.borderColor} ${style.textColor}
        border rounded-lg p-4 shadow-lg max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {notification.data.message}
          </p>
          <p className="text-xs opacity-75 mt-1">
            {new Date(notification.data.timestamp).toLocaleTimeString()}
          </p>
        </div>
        
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onDismiss(notification.data.timestamp), 300)
          }}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// REALTIME NOTIFICATIONS COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

/**
 * Real-time notifications component
 * Displays toast-style notifications for receipt uploads and analytics updates
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy, Accessibility
 */
export function RealtimeNotifications({
  maxNotifications = 5,
  autoHideDuration = 5000,
  position = 'top-right',
  className = '',
}: RealtimeNotificationsProps) {
  const { notifications, clearNotifications } = useRealtime({
    enableReceiptUpdates: true,
    enableAnalyticsUpdates: true,
  })

  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())

  // Filter out dismissed notifications
  const visibleNotifications = notifications.filter(
    notification => !dismissedNotifications.has(notification.data.timestamp)
  ).slice(0, maxNotifications)

  // Handle notification dismissal
  const handleDismiss = (timestamp: string) => {
    setDismissedNotifications(prev => new Set([...prev, timestamp]))
  }

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      default:
        return 'top-4 right-4'
    }
  }

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 ${className}`}>
      {/* Header with clear all button */}
      {visibleNotifications.length > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {visibleNotifications.length} notifications
          </span>
          <button
            onClick={clearNotifications}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
      
      {/* Notification items */}
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.data.timestamp}
          notification={notification}
          onDismiss={handleDismiss}
          autoHideDuration={autoHideDuration}
        />
      ))}
    </div>
  )
} 