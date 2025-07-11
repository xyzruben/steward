// ============================================================================
// NOTIFICATION SERVICE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for notification service functionality
// Follows master guide: Unit Testing Strategy, Mocking Practices

import { NotificationService } from '../notifications'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// MOCKS (see master guide: Mocking Practices)
// ============================================================================

const mockPrisma = {
  user: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
  },
  notification: {
    create: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
    updateMany: jest.fn() as jest.MockedFunction<any>,
    deleteMany: jest.fn() as jest.MockedFunction<any>,
    count: jest.fn() as jest.MockedFunction<any>,
  },
  notificationPreferences: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    upsert: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>,
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      send: jest.fn(),
    })),
  })),
}))

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================
const mockSupabase = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>

describe('NotificationService', () => {
  let notificationService: NotificationService

  beforeEach(() => {
    notificationService = new NotificationService()
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
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.notification.create.mockResolvedValue(mockNotification as any)

      const result = await notificationService.createNotification({
        userId: 'user-123',
        type: 'receipt_uploaded',
        title: 'Receipt Uploaded',
        message: 'Receipt has been uploaded',
        metadata: { receiptId: 'receipt-123' },
      })

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { id: true },
      })
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
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
      mockPrisma.user.findUnique.mockResolvedValue(null)

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
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.notification.create.mockRejectedValue(new Error('Database error'))

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
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications as any)

      const result = await notificationService.getNotifications('user-123')

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
      expect(result).toHaveLength(2)
    })

    it('should apply filters correctly', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotifications[0]] as any)

      const result = await notificationService.getNotifications('user-123', {
        type: 'receipt_uploaded',
        isRead: false,
        limit: 10,
        offset: 5,
      })

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
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
    })

    it('should handle date filters', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications as any)

      await notificationService.getNotifications('user-123', {
        startDate,
        endDate,
      })

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 } as any)

      await notificationService.markAsRead('notification-123', 'user-123')

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'notification-123',
          userId: 'user-123',
        },
        data: { isRead: true },
      })
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 } as any)

      await notificationService.markAllAsRead('user-123')

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
        data: { isRead: true },
      })
    })

    it('should mark specific type notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 } as any)

      await notificationService.markAllAsRead('user-123', 'receipt_uploaded')

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false, type: 'receipt_uploaded' },
        data: { isRead: true },
      })
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 1 } as any)

      await notificationService.deleteNotification('notification-123', 'user-123')

      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'notification-123',
          userId: 'user-123',
        },
      })
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5)

      const result = await notificationService.getUnreadCount('user-123')

      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRead: false,
        },
      })
      expect(result).toBe(5)
    })

    it('should return 0 on error', async () => {
      mockPrisma.notification.count.mockRejectedValue(new Error('Database error'))

      const result = await notificationService.getUnreadCount('user-123')

      expect(result).toBe(0)
    })
  })

  // ============================================================================
  // PREFERENCES TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('getPreferences', () => {
    const mockPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      emailNotifications: true,
      pushNotifications: true,
      receiptUploads: true,
      receiptProcessing: true,
      analyticsUpdates: true,
      searchSuggestions: true,
      systemAlerts: true,
      exportNotifications: true,
      backupNotifications: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should return existing preferences', async () => {
      mockPrisma.notificationPreferences.findUnique.mockResolvedValue(mockPreferences as any)

      const result = await notificationService.getPreferences('user-123')

      expect(mockPrisma.notificationPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      })
      expect(result).toEqual({
        userId: 'user-123',
        emailNotifications: true,
        pushNotifications: true,
        receiptUploads: true,
        receiptProcessing: true,
        analyticsUpdates: true,
        searchSuggestions: true,
        systemAlerts: true,
        exportNotifications: true,
        backupNotifications: true,
      })
    })

    it('should create default preferences if none exist', async () => {
      mockPrisma.notificationPreferences.findUnique.mockResolvedValue(null)
      mockPrisma.notificationPreferences.create.mockResolvedValue(mockPreferences as any)

      const result = await notificationService.getPreferences('user-123')

      expect(mockPrisma.notificationPreferences.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          emailNotifications: true,
          pushNotifications: true,
          receiptUploads: true,
          receiptProcessing: true,
          analyticsUpdates: true,
          searchSuggestions: true,
          systemAlerts: true,
          exportNotifications: true,
          backupNotifications: true,
        },
      })
      expect(result).toBeDefined()
    })
  })

  describe('updatePreferences', () => {
    it('should update existing preferences', async () => {
      const mockPreferences = {
        id: 'pref-123',
        userId: 'user-123',
        emailNotifications: false,
        pushNotifications: true,
        receiptUploads: true,
        receiptProcessing: true,
        analyticsUpdates: true,
        searchSuggestions: true,
        systemAlerts: true,
        exportNotifications: true,
        backupNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.notificationPreferences.upsert.mockResolvedValue(mockPreferences as any)

      const result = await notificationService.updatePreferences('user-123', {
        emailNotifications: false,
      })

      expect(mockPrisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: { emailNotifications: false },
        create: {
          userId: 'user-123',
          emailNotifications: false,
          pushNotifications: true,
          receiptUploads: true,
          receiptProcessing: true,
          analyticsUpdates: true,
          searchSuggestions: true,
          systemAlerts: true,
          exportNotifications: true,
          backupNotifications: true,
        },
      })
      expect(result.emailNotifications).toBe(false)
    })
  })

  // ============================================================================
  // SPECIALIZED NOTIFICATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('notifyReceiptUploaded', () => {
    it('should create receipt upload notification', async () => {
      const createNotificationSpy = jest.spyOn(notificationService, 'createNotification')
      createNotificationSpy.mockResolvedValue({} as any)

      await notificationService.notifyReceiptUploaded('user-123', 'receipt-123', 'Walmart')

      expect(createNotificationSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'receipt_uploaded',
        title: 'Receipt Uploaded',
        message: 'Receipt from Walmart has been uploaded and is being processed.',
        metadata: { receiptId: 'receipt-123', merchant: 'Walmart' },
      })
    })
  })

  describe('notifyReceiptProcessed', () => {
    it('should create receipt processed notification', async () => {
      const createNotificationSpy = jest.spyOn(notificationService, 'createNotification')
      createNotificationSpy.mockResolvedValue({} as any)

      await notificationService.notifyReceiptProcessed('user-123', 'receipt-123', 'Walmart', new Decimal(25.99))

      expect(createNotificationSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'receipt_processed',
        title: 'Receipt Processed',
        message: 'Receipt from Walmart has been processed. Total: $25.99',
        metadata: { receiptId: 'receipt-123', merchant: 'Walmart', total: '25.99' },
      })
    })
  })

  describe('notifyReceiptError', () => {
    it('should create receipt error notification', async () => {
      const createNotificationSpy = jest.spyOn(notificationService, 'createNotification')
      createNotificationSpy.mockResolvedValue({} as any)

      await notificationService.notifyReceiptError('user-123', 'receipt-123', 'OCR failed')

      expect(createNotificationSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'receipt_error',
        title: 'Receipt Processing Error',
        message: 'Failed to process receipt: OCR failed',
        metadata: { receiptId: 'receipt-123', error: 'OCR failed' },
      })
    })
  })

  describe('notifyAnalyticsUpdated', () => {
    it('should create analytics update notification', async () => {
      const createNotificationSpy = jest.spyOn(notificationService, 'createNotification')
      createNotificationSpy.mockResolvedValue({} as any)

      await notificationService.notifyAnalyticsUpdated('user-123', ['Spending increased', 'New category detected'])

      expect(createNotificationSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'analytics_updated',
        title: 'Analytics Updated',
        message: 'New insights available: Spending increased, New category detected',
        metadata: { insights: ['Spending increased', 'New category detected'] },
      })
    })
  })

  describe('notifySearchSuggestion', () => {
    it('should create search suggestion notification', async () => {
      const createNotificationSpy = jest.spyOn(notificationService, 'createNotification')
      createNotificationSpy.mockResolvedValue({} as any)

      await notificationService.notifySearchSuggestion('user-123', 'Walmart receipts')

      expect(createNotificationSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'search_suggestion',
        title: 'Search Suggestion',
        message: 'Try searching for: "Walmart receipts"',
        metadata: { suggestion: 'Walmart receipts' },
      })
    })
  })

  describe('notifySystemAlert', () => {
    it('should create system alert notification', async () => {
      const createNotificationSpy = jest.spyOn(notificationService, 'createNotification')
      createNotificationSpy.mockResolvedValue({} as any)

      await notificationService.notifySystemAlert('user-123', 'System Maintenance', 'Scheduled maintenance in 1 hour')

      expect(createNotificationSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        type: 'system_alert',
        title: 'System Maintenance',
        message: 'Scheduled maintenance in 1 hour',
        metadata: { systemAlert: true },
      })
    })
  })
}) 