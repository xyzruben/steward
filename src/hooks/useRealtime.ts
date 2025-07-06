// ============================================================================
// REALTIME HOOK (see STEWARD_MASTER_SYSTEM_GUIDE.md - React State Patterns)
// ============================================================================
// React hook for real-time notifications and updates
// Follows master guide: React State Patterns, Data Fetching Patterns

'use client'

import { useEffect, useCallback, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { realtimeService, type RealtimeNotification as RealtimeNotificationType } from '@/lib/services/realtime'

export type RealtimeNotification = RealtimeNotificationType;

// ============================================================================
// REALTIME HOOK TYPES (see master guide: TypeScript Standards)
// ============================================================================

export interface UseRealtimeOptions {
  enableReceiptUpdates?: boolean
  enableAnalyticsUpdates?: boolean
  onReceiptUploaded?: (notification: RealtimeNotification) => void
  onReceiptProcessed?: (notification: RealtimeNotification) => void
  onAnalyticsUpdated?: (notification: RealtimeNotification) => void
}

export interface UseRealtimeReturn {
  isConnected: boolean
  notifications: RealtimeNotification[]
  clearNotifications: () => void
  broadcastAnalyticsUpdate: () => Promise<void>
}

// ============================================================================
// REALTIME HOOK (see master guide: React State Patterns)
// ============================================================================

/**
 * React hook for real-time notifications and updates
 * Provides real-time functionality for receipt uploads and analytics updates
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - React State Patterns, Data Fetching Patterns
 */
export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])

  const {
    enableReceiptUpdates = true,
    enableAnalyticsUpdates = true,
    onReceiptUploaded,
    onReceiptProcessed,
    onAnalyticsUpdated,
  } = options

  // ============================================================================
  // EVENT HANDLERS (see master guide: React State Patterns)
  // ============================================================================

  const handleReceiptUploaded = useCallback((notification: RealtimeNotification) => {
    console.log('useRealtime: Receipt uploaded notification:', notification)
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10 notifications
    
    if (onReceiptUploaded) {
      onReceiptUploaded(notification)
    }
  }, [onReceiptUploaded])

  const handleReceiptProcessed = useCallback((notification: RealtimeNotification) => {
    console.log('useRealtime: Receipt processed notification:', notification)
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10 notifications
    
    if (onReceiptProcessed) {
      onReceiptProcessed(notification)
    }
  }, [onReceiptProcessed])

  const handleAnalyticsUpdated = useCallback((notification: RealtimeNotification) => {
    console.log('useRealtime: Analytics updated notification:', notification)
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10 notifications
    
    if (onAnalyticsUpdated) {
      onAnalyticsUpdated(notification)
    }
  }, [onAnalyticsUpdated])

  // ============================================================================
  // CONNECTION MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================

  const connect = useCallback(async () => {
    if (!user?.id) {
      console.log('useRealtime: No user, skipping connection')
      return
    }

    try {
      console.log('useRealtime: Connecting for user:', user.id)
      
      // Connect to real-time service
      await realtimeService.connect(user.id)
      setIsConnected(true)
      
      // Add event listeners
      if (enableReceiptUpdates) {
        realtimeService.addEventListener('receipt_uploaded', handleReceiptUploaded)
        realtimeService.addEventListener('receipt_processed', handleReceiptProcessed)
      }
      
      if (enableAnalyticsUpdates) {
        realtimeService.addEventListener('analytics_updated', handleAnalyticsUpdated)
      }
      
      console.log('useRealtime: Successfully connected and listening')
    } catch (error) {
      console.error('useRealtime: Connection failed:', error)
      setIsConnected(false)
    }
  }, [user?.id, enableReceiptUpdates, enableAnalyticsUpdates, handleReceiptUploaded, handleReceiptProcessed, handleAnalyticsUpdated])

  const disconnect = useCallback(async () => {
    try {
      console.log('useRealtime: Disconnecting')
      
      // Remove event listeners
      if (enableReceiptUpdates) {
        realtimeService.removeEventListener('receipt_uploaded', handleReceiptUploaded)
        realtimeService.removeEventListener('receipt_processed', handleReceiptProcessed)
      }
      
      if (enableAnalyticsUpdates) {
        realtimeService.removeEventListener('analytics_updated', handleAnalyticsUpdated)
      }
      
      // Disconnect from real-time service
      await realtimeService.disconnect()
      setIsConnected(false)
      
      console.log('useRealtime: Successfully disconnected')
    } catch (error) {
      console.error('useRealtime: Disconnect failed:', error)
    }
  }, [enableReceiptUpdates, enableAnalyticsUpdates, handleReceiptUploaded, handleReceiptProcessed, handleAnalyticsUpdated])

  // ============================================================================
  // EFFECTS (see master guide: React State Patterns)
  // ============================================================================

  // Connect when user is available
  useEffect(() => {
    if (user?.id) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [user?.id, connect, disconnect])

  // ============================================================================
  // UTILITY FUNCTIONS (see master guide: Code Quality and Conventions)
  // ============================================================================

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const broadcastAnalyticsUpdate = useCallback(async () => {
    if (user?.id) {
      await realtimeService.broadcastAnalyticsUpdate(user.id)
    }
  }, [user?.id])

  // ============================================================================
  // RETURN VALUE (see master guide: React State Patterns)
  // ============================================================================

  return {
    isConnected,
    notifications,
    clearNotifications,
    broadcastAnalyticsUpdate,
  }
} 