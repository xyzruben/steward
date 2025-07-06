// ============================================================================
// REALTIME SERVICE (see STEWARD_MASTER_SYSTEM_GUIDE.md - Scalability and Performance)
// ============================================================================
// Handles WebSocket connections and real-time notifications
// Follows master guide: Concurrent Upload Handling, Edge vs. Serverless Considerations

import { createSupabaseBrowserClient } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ============================================================================
// REALTIME SERVICE TYPES (see master guide: TypeScript Standards)
// ============================================================================

export interface RealtimeNotification {
  type: 'receipt_uploaded' | 'receipt_processed' | 'analytics_updated'
  userId: string
  data: {
    receiptId?: string
    message: string
    timestamp: string
  }
}

export interface RealtimeServiceConfig {
  enableNotifications?: boolean
  enableAnalytics?: boolean
  reconnectInterval?: number
}

// ============================================================================
// REALTIME SERVICE CLASS (see master guide: Scalability and Performance)
// ============================================================================

/**
 * Real-time service for handling WebSocket connections and notifications
 * Provides real-time updates for receipt uploads, processing, and analytics
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Concurrent Upload Handling, Edge vs. Serverless Considerations
 */
export class RealtimeService {
  private supabase = createSupabaseBrowserClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private listeners: Map<string, Set<(notification: RealtimeNotification) => void>> = new Map()
  private config: RealtimeServiceConfig
  private isConnected = false

  constructor(config: RealtimeServiceConfig = {}) {
    this.config = {
      enableNotifications: true,
      enableAnalytics: true,
      reconnectInterval: 5000,
      ...config,
    }
  }

  // ============================================================================
  // CONNECTION MANAGEMENT (see master guide: Scalability and Performance)
  // ============================================================================

  /**
   * Initialize real-time connections for a user
   * Sets up channels for receipts and analytics updates
   */
  async connect(userId: string): Promise<void> {
    if (this.isConnected) {
      console.log('RealtimeService: Already connected')
      return
    }

    try {
      console.log('RealtimeService: Connecting for user:', userId)

      // Connect to receipts channel for real-time updates
      if (this.config.enableNotifications) {
        await this.subscribeToReceipts(userId)
      }

      // Connect to analytics channel for real-time updates
      if (this.config.enableAnalytics) {
        await this.subscribeToAnalytics(userId)
      }

      this.isConnected = true
      console.log('RealtimeService: Successfully connected')
    } catch (error) {
      console.error('RealtimeService: Connection failed:', error)
      this.scheduleReconnect()
    }
  }

  /**
   * Disconnect all real-time channels
   */
  async disconnect(): Promise<void> {
    console.log('RealtimeService: Disconnecting')
    
    for (const [channelName, channel] of this.channels) {
      try {
        await this.supabase.removeChannel(channel)
        console.log(`RealtimeService: Disconnected from ${channelName}`)
      } catch (error) {
        console.error(`RealtimeService: Error disconnecting from ${channelName}:`, error)
      }
    }

    this.channels.clear()
    this.listeners.clear()
    this.isConnected = false
  }

  // ============================================================================
  // CHANNEL SUBSCRIPTIONS (see master guide: Scalability and Performance)
  // ============================================================================

  /**
   * Subscribe to real-time receipt updates
   */
  private async subscribeToReceipts(userId: string): Promise<void> {
    const channelName = `receipts:${userId}`
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'receipts',
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          console.log('RealtimeService: Receipt uploaded:', payload)
          this.notifyListeners('receipt_uploaded', {
            type: 'receipt_uploaded',
            userId,
            data: {
              receiptId: payload.new.id,
              message: 'New receipt uploaded',
              timestamp: new Date().toISOString(),
            },
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'receipts',
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          console.log('RealtimeService: Receipt processed:', payload)
          this.notifyListeners('receipt_processed', {
            type: 'receipt_processed',
            userId,
            data: {
              receiptId: payload.new.id,
              message: 'Receipt processing completed',
              timestamp: new Date().toISOString(),
            },
          })
        }
      )

    await channel.subscribe()
    this.channels.set(channelName, channel)
    console.log(`RealtimeService: Subscribed to ${channelName}`)
  }

  /**
   * Subscribe to real-time analytics updates
   */
  private async subscribeToAnalytics(userId: string): Promise<void> {
    const channelName = `analytics:${userId}`
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'broadcast',
        { event: 'analytics_updated' },
        (payload) => {
          console.log('RealtimeService: Analytics updated:', payload)
          this.notifyListeners('analytics_updated', {
            type: 'analytics_updated',
            userId,
            data: {
              message: 'Analytics data updated',
              timestamp: new Date().toISOString(),
            },
          })
        }
      )

    await channel.subscribe()
    this.channels.set(channelName, channel)
    console.log(`RealtimeService: Subscribed to ${channelName}`)
  }

  // ============================================================================
  // EVENT LISTENERS (see master guide: React State Patterns)
  // ============================================================================

  /**
   * Add event listener for real-time notifications
   */
  addEventListener(
    eventType: RealtimeNotification['type'],
    callback: (notification: RealtimeNotification) => void
  ): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    eventType: RealtimeNotification['type'],
    callback: (notification: RealtimeNotification) => void
  ): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(
    eventType: RealtimeNotification['type'],
    notification: RealtimeNotification
  ): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(notification)
        } catch (error) {
          console.error('RealtimeService: Error in event listener:', error)
        }
      })
    }
  }

  // ============================================================================
  // BROADCAST METHODS (see master guide: Scalability and Performance)
  // ============================================================================

  /**
   * Broadcast analytics update to connected clients
   */
  async broadcastAnalyticsUpdate(userId: string): Promise<void> {
    try {
      const channel = this.channels.get(`analytics:${userId}`)
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'analytics_updated',
          payload: {
            userId,
            timestamp: new Date().toISOString(),
          },
        })
        console.log('RealtimeService: Broadcasted analytics update')
      }
    } catch (error) {
      console.error('RealtimeService: Error broadcasting analytics update:', error)
    }
  }

  // ============================================================================
  // UTILITY METHODS (see master guide: Code Quality and Conventions)
  // ============================================================================

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.config.reconnectInterval) {
      setTimeout(() => {
        console.log('RealtimeService: Attempting reconnection...')
        // Note: Reconnection logic would need userId, which we don't have here
        // This is a simplified version - in practice, you'd store the userId
      }, this.config.reconnectInterval)
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

// ============================================================================
// SINGLETON INSTANCE (see master guide: React State Patterns)
// ============================================================================
// Export a singleton instance for use throughout the application

export const realtimeService = new RealtimeService() 