// ============================================================================
// NOTIFICATION SERVICE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for notification service functionality
// Follows master guide: Unit Testing Strategy, Mocking Practices
// Uses global mocks from jest.setup.js for consistent isolation

import { NotificationService } from '../notifications'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

describe('NotificationService', () => {
  let notificationService: NotificationService

  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    
    // Create fresh service instance
    notificationService = new NotificationService()
    
    // Setup default successful responses using global mocks
    // These are already configured in jest.setup.js, but we can override for specific tests
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // NOTIFICATION CRUD TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('createNotification', () => {
    const mockUser = { id: 'user-123' }
    const mockNotification = {
      id: 'notification-123',
      userId: 'user-123',
      type: 'receipt_uploaded',
      title: 'Receipt Uploaded',
      message: 'Receipt has been uploaded',
      metadata: { receiptId: 'receipt-123' },
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should create a notification successfully', async () => {
      // Override global mock for this specific test
      prisma.user.findUnique.mockResolvedValue(mockUser as any)
      prisma.notification.create.mockResolvedValue(mockNotification as any)

      const result = await notificationService.createNotification({
        userId: 'user-123',
        type: 'receipt_uploaded',
        title: 'Receipt Uploaded',
        message: 'Receipt has been uploaded',
        metadata: { receiptId: 'receipt-123' },
      })

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { id: true },
      })
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          type: 'receipt_uploaded',
          title: 'Receipt Uploaded',
          message: 'Receipt has been uploaded',
          metadata: { receiptId: 'receipt-123' },
          isRead: false,
        },
      })
      expect(result).toEqual({
        id: 'notification-123',
        userId: 'user-123',
        type: 'receipt_uploaded',
        title: 'Receipt Uploaded',
        message: 'Receipt has been uploaded',
        metadata: { receiptId: 'receipt-123' },
        isRead: false,
        createdAt: mockNotification.createdAt,
        updatedAt: mockNotification.updatedAt,
      })
    })

    it('should throw error if user not found', async () => {
      // Override global mock to simulate user not found
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        notificationService.createNotification({
          userId: 'user-123',
          type: 'receipt_uploaded',
          title: 'Receipt Uploaded',
          message: 'Receipt has been uploaded',
        })
      ).rejects.toThrow('Failed to create notification')
    })

    it('should handle database errors gracefully', async () => {
      // Override global mock to simulate database error
      prisma.user.findUnique.mockResolvedValue(mockUser as any)
      prisma.notification.create.mockRejectedValue(new Error('Database error'))

      await expect(
        notificationService.createNotification({
          userId: 'user-123',
          type: 'receipt_uploaded',
          title: 'Receipt Uploaded',
          message: 'Receipt has been uploaded',
        })
      ).rejects.toThrow('Failed to create notification')
    })
  })

  describe('getNotifications', () => {
    const mockNotifications = [
      {
        id: 'notification-1',
        userId: 'user-123',
        type: 'receipt_uploaded',
        title: 'Receipt Uploaded',
        message: 'Receipt has been uploaded',
        metadata: {},
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'notification-2',
        userId: 'user-123',
        type: 'receipt_processed',
        title: 'Receipt Processed',
        message: 'Receipt has been processed',
        metadata: {},
        isRead: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    it('should get notifications with default filters', async () => {
      // Override global mock for this specific test
      prisma.notification.findMany.mockResolvedValue(mockNotifications as any)

      const result = await notificationService.getNotifications('user-123')

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
      expect(result).toHaveLength(2)
    })

    it('should apply filters correctly', async () => {
      // Override global mock for this specific test
      prisma.notification.findMany.mockResolvedValue([mockNotifications[0]] as any)

      const result = await notificationService.getNotifications('user-123', {
        type: 'receipt_uploaded',
        isRead: false,
        limit: 10,
        offset: 5,
      })

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          type: 'receipt_uploaded',
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 5,
      })
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('receipt_uploaded')
    })

    it('should handle empty results', async () => {
      // Override global mock to simulate no notifications
      prisma.notification.findMany.mockResolvedValue([])

      const result = await notificationService.getNotifications('user-123')

      expect(result).toHaveLength(0)
    })
  })

  describe('markAsRead', () => {
    it('should mark notifications as read', async () => {
      // Override global mock for this specific test
      prisma.notification.updateMany.mockResolvedValue({ count: 2 })

      const result = await notificationService.markAsRead('user-123', ['notification-1', 'notification-2'])

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          id: { in: ['notification-1', 'notification-2'] },
        },
        data: { isRead: true },
      })
      expect(result).toBe(2)
    })

    it('should handle empty notification IDs', async () => {
      const result = await notificationService.markAsRead('user-123', [])

      expect(prisma.notification.updateMany).not.toHaveBeenCalled()
      expect(result).toBe(0)
    })
  })

  describe('deleteNotifications', () => {
    it('should delete notifications', async () => {
      // Override global mock for this specific test
      prisma.notification.deleteMany.mockResolvedValue({ count: 2 })

      const result = await notificationService.deleteNotifications('user-123', ['notification-1', 'notification-2'])

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          id: { in: ['notification-1', 'notification-2'] },
        },
      })
      expect(result).toBe(2)
    })
  })

  describe('getNotificationCount', () => {
    it('should return unread notification count', async () => {
      // Override global mock for this specific test
      prisma.notification.count.mockResolvedValue(5)

      const result = await notificationService.getNotificationCount('user-123')

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRead: false,
        },
      })
      expect(result).toBe(5)
    })
  })

  // ============================================================================
  // NOTIFICATION PREFERENCES TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('getPreferences', () => {
    const mockPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      emailNotifications: true,
      pushNotifications: false,
      smsNotifications: false,
      categories: ['receipt_uploaded', 'receipt_processed'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should get user notification preferences', async () => {
      // Override global mock for this specific test
      prisma.notificationPreferences.findUnique.mockResolvedValue(mockPreferences as any)

      const result = await notificationService.getPreferences('user-123')

      expect(prisma.notificationPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      })
      expect(result).toEqual(mockPreferences)
    })

    it('should return default preferences if none exist', async () => {
      // Override global mock to simulate no preferences
      prisma.notificationPreferences.findUnique.mockResolvedValue(null)

      const result = await notificationService.getPreferences('user-123')

      expect(result).toEqual({
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        categories: ['receipt_uploaded', 'receipt_processed', 'receipt_error'],
      })
    })
  })

  describe('updatePreferences', () => {
    const mockPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      emailNotifications: true,
      pushNotifications: false,
      smsNotifications: false,
      categories: ['receipt_uploaded'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should update existing preferences', async () => {
      // Override global mock for this specific test
      prisma.notificationPreferences.upsert.mockResolvedValue(mockPreferences as any)

      const result = await notificationService.updatePreferences('user-123', {
        emailNotifications: true,
        pushNotifications: false,
        categories: ['receipt_uploaded'],
      })

      expect(prisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: {
          emailNotifications: true,
          pushNotifications: false,
          categories: ['receipt_uploaded'],
        },
        create: {
          userId: 'user-123',
          emailNotifications: true,
          pushNotifications: false,
          categories: ['receipt_uploaded'],
        },
      })
      expect(result).toEqual(mockPreferences)
    })
  })

  // ============================================================================
  // REAL-TIME NOTIFICATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('sendRealtimeNotification', () => {
    it('should send real-time notification via Supabase', async () => {
      const mockChannel = {
        send: jest.fn().mockResolvedValue(undefined),
      }
      
      // Override global mock for this specific test
      const mockSupabaseClient = {
        channel: jest.fn().mockReturnValue(mockChannel),
      }
      ;(createSupabaseServerClient as jest.Mock).mockReturnValue(mockSupabaseClient)

      await notificationService.sendRealtimeNotification('user-123', {
        type: 'receipt_uploaded',
        title: 'Receipt Uploaded',
        message: 'Your receipt has been uploaded',
      })

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('notifications:user-123')
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'notification',
        payload: {
          type: 'receipt_uploaded',
          title: 'Receipt Uploaded',
          message: 'Your receipt has been uploaded',
        },
      })
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Override global mock to simulate database connection error
      prisma.user.findUnique.mockRejectedValue(new Error('Connection failed'))

      await expect(
        notificationService.createNotification({
          userId: 'user-123',
          type: 'receipt_uploaded',
          title: 'Receipt Uploaded',
          message: 'Receipt has been uploaded',
        })
      ).rejects.toThrow('Failed to create notification')
    })

    it('should handle invalid user ID', async () => {
      await expect(
        notificationService.createNotification({
          userId: '',
          type: 'receipt_uploaded',
          title: 'Receipt Uploaded',
          message: 'Receipt has been uploaded',
        })
      ).rejects.toThrow('Invalid user ID')
    })

    it('should handle invalid notification type', async () => {
      await expect(
        notificationService.createNotification({
          userId: 'user-123',
          type: 'invalid_type' as any,
          title: 'Receipt Uploaded',
          message: 'Receipt has been uploaded',
        })
      ).rejects.toThrow('Invalid notification type')
    })
  })
}) 