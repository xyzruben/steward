// ============================================================================
// NOTIFICATION CENTER COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Comprehensive notification management interface
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React, { useState, useEffect } from 'react'
import { Bell, X, Check, Trash2, Settings, Filter, Search, RefreshCw } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import type { NotificationData, NotificationType } from '@/lib/services/notifications'

// ============================================================================
// COMPONENT INTERFACE (see master guide: TypeScript Standards)
// ============================================================================

interface NotificationCenterProps {
  maxNotifications?: number
  showPreferences?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}

interface NotificationItemProps {
  notification: NotificationData
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

// ============================================================================
// NOTIFICATION ITEM COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(true)

  const getIcon = () => {
    switch (notification.type) {
      case 'receipt_uploaded':
        return <Bell className="w-5 h-5 text-blue-600" />
      case 'receipt_processed':
        return <Check className="w-5 h-5 text-green-600" />
      case 'receipt_error':
        return <X className="w-5 h-5 text-red-600" />
      case 'analytics_updated':
        return <RefreshCw className="w-5 h-5 text-purple-600" />
      case 'search_suggestion':
        return <Search className="w-5 h-5 text-orange-600" />
      case 'system_alert':
        return <Settings className="w-5 h-5 text-gray-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeColor = () => {
    switch (notification.type) {
      case 'receipt_uploaded':
        return 'border-l-blue-500 bg-blue-50'
      case 'receipt_processed':
        return 'border-l-green-500 bg-green-50'
      case 'receipt_error':
        return 'border-l-red-500 bg-red-50'
      case 'analytics_updated':
        return 'border-l-purple-500 bg-purple-50'
      case 'search_suggestion':
        return 'border-l-orange-500 bg-orange-50'
      case 'system_alert':
        return 'border-l-gray-500 bg-gray-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (!isVisible) return null

  return (
    <div
      className={`
        ${getTypeColor()} border-l-4 p-4 rounded-r-lg shadow-sm
        transition-all duration-200 ease-in-out
        ${notification.isRead ? 'opacity-75' : 'opacity-100'}
        hover:shadow-md cursor-pointer
      `}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {notification.title}
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {formatTime(notification.createdAt.toString())}
              </p>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(notification.id)
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// NOTIFICATION CENTER COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

/**
 * Comprehensive notification center component
 * Provides full notification management with filtering, preferences, and real-time updates
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy, Accessibility
 */
export function NotificationCenter({
  maxNotifications = 20,
  showPreferences = true,
  position = 'top-right',
  className = '',
}: NotificationCenterProps) {
  const {
    notifications,
    preferences,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    updatePreferences,
    isConnected,
    connect,
    disconnect,
  } = useNotifications({
    maxNotifications,
    enableRealTime: true,
  })

  // ============================================================================
  // LOCAL STATE (see master guide: React State Patterns)
  // ============================================================================

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications')
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // ============================================================================
  // FILTERED NOTIFICATIONS (see master guide: Code Quality and Conventions)
  // ============================================================================

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesType && matchesSearch
  })

  // ============================================================================
  // EVENT HANDLERS (see master guide: React State Patterns)
  // ============================================================================

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(filterType === 'all' ? undefined : filterType)
  }

  const handleRefresh = async () => {
    await refreshNotifications()
  }

  const handleToggleRealTime = async () => {
    if (isConnected) {
      await disconnect()
    } else {
      await connect()
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS (see master guide: Code Quality and Conventions)
  // ============================================================================

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

  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'receipt_uploaded':
        return 'Receipt Uploads'
      case 'receipt_processed':
        return 'Receipt Processing'
      case 'receipt_error':
        return 'Receipt Errors'
      case 'analytics_updated':
        return 'Analytics'
      case 'search_suggestion':
        return 'Search Suggestions'
      case 'system_alert':
        return 'System Alerts'
      default:
        return type
    }
  }

  // ============================================================================
  // RENDER (see master guide: Component Testing)
  // ============================================================================

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-3 bg-white rounded-full shadow-lg
          hover:shadow-xl transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${isOpen ? 'ring-2 ring-blue-500' : ''}
        `}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {showPreferences && (
                <button
                  onClick={() => setActiveTab(activeTab === 'notifications' ? 'preferences' : 'notifications')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Notification preferences"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {activeTab === 'notifications' ? (
              <>
                {/* Filters and Search */}
                <div className="p-4 border-b border-gray-200 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Type Filter */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="receipt_uploaded">Receipt Uploads</option>
                      <option value="receipt_processed">Receipt Processing</option>
                      <option value="receipt_error">Receipt Errors</option>
                      <option value="analytics_updated">Analytics</option>
                      <option value="search_suggestion">Search Suggestions</option>
                      <option value="system_alert">System Alerts</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={filteredNotifications.filter(n => !n.isRead).length === 0}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Mark all as read
                    </button>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="p-4 space-y-3">
                  {error && (
                    <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
                      {error}
                    </div>
                  )}

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No notifications found</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                      />
                    ))
                  )}
                </div>
              </>
            ) : (
              /* Preferences Tab */
              <div className="p-4">
                <h4 className="text-lg font-semibold mb-4">Notification Preferences</h4>
                {preferences ? (
                  <div className="space-y-4">
                    {Object.entries(preferences).map(([key, value]) => {
                      if (key === 'userId') return null
                      
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </label>
                          <button
                            onClick={() => updatePreferences({ [key]: !value })}
                            className={`
                              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                              ${value ? 'bg-blue-600' : 'bg-gray-200'}
                            `}
                          >
                            <span
                              className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${value ? 'translate-x-6' : 'translate-x-1'}
                              `}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Loading preferences...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 