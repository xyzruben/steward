// ============================================================================
// NOTIFICATION SERVICE (see STEWARD_MASTER_SYSTEM_GUIDE.md - Scalability and Performance)
// ============================================================================
// Comprehensive notification management system
// Follows master guide: Concurrent Upload Handling, TypeScript Standards, Security Requirements

import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase'
import { Prisma } from '@prisma/client'

// ============================================================================
// NOTIFICATION TYPES (see master guide: TypeScript Standards)
// ============================================================================

export interface NotificationData {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export type NotificationType = 
  | 'receipt_uploaded'
  | 'receipt_processed'
  | 'receipt_error'
  | 'analytics_updated'
  | 'search_suggestion'
  | 'system_alert'
  | 'export_completed'
  | 'backup_created'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export interface NotificationPreferences {
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  receiptUploads: boolean
  receiptProcessing: boolean
  analyticsUpdates: boolean
  searchSuggestions: boolean
  systemAlerts: boolean
  exportNotifications: boolean
  backupNotifications: boolean
}

export interface NotificationFilters {
  type?: NotificationType
  isRead?: boolean
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// ============================================================================
// NOTIFICATION SERVICE CLASS (see master guide: Scalability and Performance)
// ============================================================================

/**
 * Comprehensive notification service for managing user notifications
 * Provides CRUD operations, preferences management, and real-time broadcasting
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Scalability and Performance, Security Requirements
 */
export class NotificationService {
  // Remove the problematic line that creates Supabase client at module level
  // private supabase = createSupabaseServerClient()

  // ============================================================================
  // NOTIFICATION CRUD OPERATIONS (see master guide: Database Query Optimization)
  // ============================================================================

  /**
   * Create a new notification for a user
   * Includes validation, persistence, and real-time broadcasting
   */
  async createNotification(params: CreateNotificationParams): Promise<NotificationData> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { id: true }
      })

      if (!user) {
        // User doesn't exist in our database yet, throw error
        throw new Error(`User ${params.userId} not found`)
      }

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          metadata: params.metadata as Prisma.JsonObject || {},
          isRead: false,
        }
      })

      // Optionally: implement or remove broadcastNotification and mapToNotificationData
      // return notification as NotificationData
      return notification as unknown as NotificationData
    } catch (error) {
      console.error('NotificationService: Failed to create notification:', error)
      throw new Error('Failed to create notification')
    }
  }

  /**
   * Get notifications for a user with optional filtering
   */
  async getNotifications(userId: string, filters: NotificationFilters = {}): Promise<NotificationData[]> {
    try {
      // First, check if the user exists in our database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // User doesn't exist in our database yet, return empty array
        // This prevents foreign key constraint violations
        return []
      }

      const where: {
        userId: string
        type?: NotificationType
        isRead?: boolean
        createdAt?: {
          gte?: Date
          lte?: Date
        }
      } = { userId }

      if (filters.type) {
        where.type = filters.type
      }

      if (filters.isRead !== undefined) {
        where.isRead = filters.isRead
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {}
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate
        }
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      })

      return notifications as unknown as NotificationData[]
    } catch (error) {
      console.error('NotificationService: Failed to get notifications:', error)
      throw new Error('Failed to get notifications')
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      // First, check if the user exists in our database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // User doesn't exist in our database yet, return early
        return
      }

      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId, // Ensure user can only update their own notifications
        },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('NotificationService: Failed to mark notification as read:', error)
      throw new Error('Failed to mark notification as read')
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, type?: NotificationType): Promise<void> {
    try {
      // First, check if the user exists in our database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // User doesn't exist in our database yet, return early
        return
      }

      const where: {
        userId: string
        isRead: boolean
        type?: NotificationType
      } = { userId, isRead: false }
      if (type) {
        where.type = type
      }

      await prisma.notification.updateMany({
        where,
        data: { isRead: true }
      })
    } catch (error) {
      console.error('NotificationService: Failed to mark all notifications as read:', error)
      throw new Error('Failed to mark all notifications as read')
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      // First, check if the user exists in our database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // User doesn't exist in our database yet, return early
        return
      }

      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId, // Ensure user can only delete their own notifications
        }
      })
    } catch (error) {
      console.error('NotificationService: Failed to delete notification:', error)
      throw new Error('Failed to delete notification')
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      // First, check if the user exists in our database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // User doesn't exist in our database yet, return 0
        return 0
      }

      return await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    } catch (error) {
      console.error('NotificationService: Failed to get unread count:', error)
      return 0
    }
  }

  // ============================================================================
  // NOTIFICATION PREFERENCES (see master guide: Security Requirements)
  // ============================================================================

  /**
   * Get notification preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // First, check if the user exists in our database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // User doesn't exist in our database yet, return default preferences
        // This prevents foreign key constraint violations
        return {
          userId,
          emailNotifications: true,
          pushNotifications: true,
          receiptUploads: true,
          receiptProcessing: true,
          analyticsUpdates: true,
          searchSuggestions: true,
          systemAlerts: true,
          exportNotifications: true,
          backupNotifications: true,
        }
      }

      const preferences = await prisma.notificationPreferences.findUnique({
        where: { userId }
      })

      if (!preferences) {
        // Create default preferences if none exist using upsert to handle race conditions
        const defaultPreferences = await prisma.notificationPreferences.upsert({
          where: { userId },
          update: {}, // No updates if exists
          create: {
            userId,
            emailNotifications: true,
            pushNotifications: true,
            receiptUploads: true,
            receiptProcessing: true,
            analyticsUpdates: true,
            searchSuggestions: true,
            systemAlerts: true,
            exportNotifications: true,
            backupNotifications: true,
          }
        })

        return {
          userId: defaultPreferences.userId,
          emailNotifications: defaultPreferences.emailNotifications,
          pushNotifications: defaultPreferences.pushNotifications,
          receiptUploads: defaultPreferences.receiptUploads,
          receiptProcessing: defaultPreferences.receiptProcessing,
          analyticsUpdates: defaultPreferences.analyticsUpdates,
          searchSuggestions: defaultPreferences.searchSuggestions,
          systemAlerts: defaultPreferences.systemAlerts,
          exportNotifications: defaultPreferences.exportNotifications,
          backupNotifications: defaultPreferences.backupNotifications,
        }
      }

      return {
        userId: preferences.userId,
        emailNotifications: preferences.emailNotifications,
        pushNotifications: preferences.pushNotifications,
        receiptUploads: preferences.receiptUploads,
        receiptProcessing: preferences.receiptProcessing,
        analyticsUpdates: preferences.analyticsUpdates,
        searchSuggestions: preferences.searchSuggestions,
        systemAlerts: preferences.systemAlerts,
        exportNotifications: preferences.exportNotifications,
        backupNotifications: preferences.backupNotifications,
      }
    } catch (error) {
      console.error('NotificationService: Failed to get preferences:', error)
      throw new Error('Failed to get notification preferences')
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      // First, check if the user exists in our database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        // User doesn't exist in our database yet, return default preferences
        // This prevents foreign key constraint violations
        return {
          userId,
          emailNotifications: preferences.emailNotifications ?? true,
          pushNotifications: preferences.pushNotifications ?? true,
          receiptUploads: preferences.receiptUploads ?? true,
          receiptProcessing: preferences.receiptProcessing ?? true,
          analyticsUpdates: preferences.analyticsUpdates ?? true,
          searchSuggestions: preferences.searchSuggestions ?? true,
          systemAlerts: preferences.systemAlerts ?? true,
          exportNotifications: preferences.exportNotifications ?? true,
          backupNotifications: preferences.backupNotifications ?? true,
        }
      }

      const updated = await prisma.notificationPreferences.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          emailNotifications: preferences.emailNotifications ?? true,
          pushNotifications: preferences.pushNotifications ?? true,
          receiptUploads: preferences.receiptUploads ?? true,
          receiptProcessing: preferences.receiptProcessing ?? true,
          analyticsUpdates: preferences.analyticsUpdates ?? true,
          searchSuggestions: preferences.searchSuggestions ?? true,
          systemAlerts: preferences.systemAlerts ?? true,
          exportNotifications: preferences.exportNotifications ?? true,
          backupNotifications: preferences.backupNotifications ?? true,
        }
      })

      return {
        userId: updated.userId,
        emailNotifications: updated.emailNotifications,
        pushNotifications: updated.pushNotifications,
        receiptUploads: updated.receiptUploads,
        receiptProcessing: updated.receiptProcessing,
        analyticsUpdates: updated.analyticsUpdates,
        searchSuggestions: updated.searchSuggestions,
        systemAlerts: updated.systemAlerts,
        exportNotifications: updated.exportNotifications,
        backupNotifications: updated.backupNotifications,
      }
    } catch (error) {
      console.error('NotificationService: Failed to update preferences:', error)
      throw new Error('Failed to update notification preferences')
    }
  }

  // ============================================================================
  // SPECIALIZED NOTIFICATION METHODS (see master guide: Code Quality and Conventions)
  // ============================================================================

  /**
   * Create receipt upload notification
   */
  async notifyReceiptUploaded(userId: string, receiptId: string, merchant: string): Promise<void> {
    const preferences = await this.getPreferences(userId)
    
    if (!preferences.receiptUploads) {
      return
    }

    await this.createNotification({
      userId,
      type: 'receipt_uploaded',
      title: 'Receipt Uploaded',
      message: `Receipt from ${merchant} has been uploaded and is being processed.`,
      metadata: { receiptId, merchant },
    })
  }

  /**
   * Create receipt processed notification
   */
  async notifyReceiptProcessed(userId: string, receiptId: string, merchant: string, total: any): Promise<void> {
    const preferences = await this.getPreferences(userId)
    
    if (!preferences.receiptProcessing) {
      return
    }

    await this.createNotification({
      userId,
      type: 'receipt_processed',
      title: 'Receipt Processed',
      message: `Receipt from ${merchant} has been processed. Total: $${total.toString()}`,
      metadata: { receiptId, merchant, total: total.toString() },
    })
  }

  /**
   * Create receipt error notification
   */
  async notifyReceiptError(userId: string, receiptId: string, error: string): Promise<void> {
    const preferences = await this.getPreferences(userId)
    
    if (!preferences.receiptProcessing) {
      return
    }

    await this.createNotification({
      userId,
      type: 'receipt_error',
      title: 'Receipt Processing Error',
      message: `Failed to process receipt: ${error}`,
      metadata: { receiptId, error },
    })
  }

  /**
   * Create analytics update notification
   */
  async notifyAnalyticsUpdated(userId: string, insights: string[]): Promise<void> {
    const preferences = await this.getPreferences(userId)
    
    if (!preferences.analyticsUpdates) {
      return
    }

    await this.createNotification({
      userId,
      type: 'analytics_updated',
      title: 'Analytics Updated',
      message: `New insights available: ${insights.join(', ')}`,
      metadata: { insights },
    })
  }

  /**
   * Create search suggestion notification
   */
  async notifySearchSuggestion(userId: string, suggestion: string): Promise<void> {
    const preferences = await this.getPreferences(userId)
    
    if (!preferences.searchSuggestions) {
      return
    }

    await this.createNotification({
      userId,
      type: 'search_suggestion',
      title: 'Search Suggestion',
      message: `Try searching for: "${suggestion}"`,
      metadata: { suggestion },
    })
  }

  /**
   * Create system alert notification
   */
  async notifySystemAlert(userId: string, title: string, message: string): Promise<void> {
    const preferences = await this.getPreferences(userId)
    
    if (!preferences.systemAlerts) {
      return
    }

    await this.createNotification({
      userId,
      type: 'system_alert',
      title,
      message,
      metadata: { systemAlert: true },
    })
  }
}

// ============================================================================
// GLOBAL SERVICE INSTANCE (see master guide: Code Quality and Conventions)
// ============================================================================

export const notificationService = new NotificationService()