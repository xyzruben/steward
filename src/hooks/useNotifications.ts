// ============================================================================
// NOTIFICATIONS HOOK (see STEWARD_MASTER_SYSTEM_GUIDE.md - React State Patterns)
// ============================================================================
// React hook for comprehensive notification management
// Follows master guide: React State Patterns, Data Fetching Patterns, TypeScript Standards

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { NotificationData, NotificationPreferences, NotificationFilters } from '@/lib/services/notifications'

// ============================================================================
// NOTIFICATION HOOK TYPES (see master guide: TypeScript Standards)
// ============================================================================

export interface UseNotificationsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  maxNotifications?: number
  enableRealTime?: boolean
}

export interface UseNotificationsReturn {
  // State
  notifications: NotificationData[]
  preferences: NotificationPreferences | null
  unreadCount: number
  isLoading: boolean
  error: string | null
  
  // Actions
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: (type?: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>
  
  // Real-time
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

// ============================================================================
// NOTIFICATIONS HOOK (see master guide: React State Patterns)
// ============================================================================

/**
 * Comprehensive notifications hook for managing user notifications
 * Provides CRUD operations, preferences management, and real-time updates
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - React State Patterns, Data Fetching Patterns
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { user } = useAuth()
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    maxNotifications = 50,
    enableRealTime = true,
  } = options

  // ============================================================================
  // STATE MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================

  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Refs for cleanup
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const realtimeChannelRef = useRef<any>(null)

  // ============================================================================
  // API CALLS (see master guide: Data Fetching Patterns)
  // ============================================================================

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.isRead !== undefined) params.append('isRead', filters.isRead.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/notifications?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setNotifications(result.data)
        setUnreadCount(result.data.filter((n: NotificationData) => !n.isRead).length)
      } else {
        throw new Error(result.error || 'Failed to fetch notifications')
      }
    } catch (err) {
      console.error('useNotifications: Failed to fetch notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  /**
   * Fetch notification preferences
   */
  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/notifications/preferences')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setPreferences(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch preferences')
      }
    } catch (err) {
      console.error('useNotifications: Failed to fetch preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
    }
  }, [user?.id])

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (id: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`)
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('useNotifications: Failed to mark notification as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read')
    }
  }, [user?.id])

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (type?: string) => {
    if (!user?.id) return

    try {
      const params = new URLSearchParams()
      if (type) params.append('type', type)

      const response = await fetch(`/api/notifications/mark-all-read?${params.toString()}`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`)
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          !type || notification.type === type
            ? { ...notification, isRead: true }
            : notification
        )
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('useNotifications: Failed to mark all notifications as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read')
    }
  }, [user?.id])

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (id: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`)
      }

      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== id))
      setUnreadCount(prev => {
        const deletedNotification = notifications.find(n => n.id === id)
        return deletedNotification && !deletedNotification.isRead ? prev - 1 : prev
      })
    } catch (err) {
      console.error('useNotifications: Failed to delete notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }, [user?.id, notifications])

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      })

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setPreferences(result.data)
      } else {
        throw new Error(result.error || 'Failed to update preferences')
      }
    } catch (err) {
      console.error('useNotifications: Failed to update preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
    }
  }, [user?.id])

  /**
   * Refresh notifications
   */
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications({ limit: maxNotifications })
  }, [fetchNotifications, maxNotifications])

  // ============================================================================
  // REAL-TIME CONNECTIONS (see master guide: Scalability and Performance)
  // ============================================================================

  /**
   * Connect to real-time notifications
   */
  const connect = useCallback(async () => {
    if (!user?.id || !enableRealTime) return

    try {
      // For now, we'll use polling for real-time updates
      // In a production environment, you'd integrate with WebSockets
      setIsConnected(true)
      
      // Set up polling for real-time updates
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      
      refreshIntervalRef.current = setInterval(() => {
        refreshNotifications()
      }, refreshInterval)
      
    } catch (err) {
      console.error('useNotifications: Failed to connect to real-time:', err)
      setIsConnected(false)
    }
  }, [user?.id, enableRealTime, refreshInterval, refreshNotifications])

  /**
   * Disconnect from real-time notifications
   */
  const disconnect = useCallback(async () => {
    try {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
      
      setIsConnected(false)
    } catch (err) {
      console.error('useNotifications: Failed to disconnect:', err)
    }
  }, [])

  // ============================================================================
  // EFFECTS (see master guide: React State Patterns)
  // ============================================================================

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchNotifications({ limit: maxNotifications })
      fetchPreferences()
    }
  }, [user?.id, fetchNotifications, fetchPreferences, maxNotifications])

  // Auto-refresh setup
  useEffect(() => {
    if (user?.id && autoRefresh) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [user?.id, autoRefresh, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

  // ============================================================================
  // RETURN VALUE (see master guide: React State Patterns)
  // ============================================================================

  return {
    // State
    notifications,
    preferences,
    unreadCount,
    isLoading,
    error,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    updatePreferences,
    
    // Real-time
    isConnected,
    connect,
    disconnect,
  }
} 