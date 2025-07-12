// ============================================================================
// NOTIFICATION SERVICE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for notification service functionality
// Follows master guide: Unit Testing Strategy, Mocking Practices
// Uses global mocks from jest.setup.js for consistent isolation

import { NotificationService } from '../notifications'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockNotification = {
  id: 'notification-1',
  userId: 'test-user-id',
  type: 'receipt_uploaded',
  title: 'Receipt Uploaded',
  message: 'Your receipt has been uploaded successfully',
  read: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockNotificationPreferences = {
  id: 'prefs-1',
  userId: 'test-user-id',
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

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('NotificationService', () => {
  let notificationService: NotificationService

  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    
    // Create service instance
    notificationService = new NotificationService()
    
    // Setup default successful responses using global mocks
    // These are already configured in jest.setup.js, but we can override for specific tests
    
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('@/lib/prisma')
    
    // Mock Prisma methods with proper Jest mock functions
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser)
    prisma.notification.create = jest.fn().mockResolvedValue(mockNotification)
    prisma.notification.findMany = jest.fn().mockResolvedValue([mockNotification])
    prisma.notification.updateMany = jest.fn().mockResolvedValue({ count: 1 })
    prisma.notification.deleteMany = jest.fn().mockResolvedValue({ count: 1 })
    prisma.notification.count = jest.fn().mockResolvedValue(1)
    prisma.notificationPreferences.findUnique = jest.fn().mockResolvedValue(mockNotificationPreferences)
    prisma.notificationPreferences.upsert = jest.fn().mockResolvedValue(mockNotificationPreferences)
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // NOTIFICATION CREATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Notification Creation', () => {
    it('should create notification successfully', async () => {
      // Arrange
      const notificationData = {
        userId: 'test-user-id',
        type: 'receipt_uploaded' as const,
        title: 'Receipt Uploaded',
        message: 'Your receipt has been uploaded successfully',
      }

      // Act
      const result = await notificationService.createNotification(notificationData)

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe('notification-1')
      expect(result.type).toBe('receipt_uploaded')
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          ...notificationData,
          isRead: false,
          metadata: {},
        },
      })
    })

    it('should handle user not found', async () => {
      // Arrange
      // Override global mock to simulate user not found
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique = jest.fn().mockResolvedValue(null)

      const notificationData = {
        userId: 'non-existent-user',
        type: 'receipt_uploaded' as const,
        title: 'Receipt Uploaded',
        message: 'Your receipt has been uploaded successfully',
      }

      // Act & Assert
      await expect(notificationService.createNotification(notificationData)).rejects.toThrow()
    })

    it('should handle database errors', async () => {
      // Arrange
      // Override global mock to simulate database error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.notification.create = jest.fn().mockRejectedValue(new Error('Database error'))

      const notificationData = {
        userId: 'test-user-id',
        type: 'receipt_uploaded' as const,
        title: 'Receipt Uploaded',
        message: 'Your receipt has been uploaded successfully',
      }

      // Act & Assert
      await expect(notificationService.createNotification(notificationData)).rejects.toThrow()
    })
  })

  // ============================================================================
  // NOTIFICATION RETRIEVAL TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Notification Retrieval', () => {
    it('should get notifications for user', async () => {
      // Arrange
      const userId = 'test-user-id'

      // Act
      const result = await notificationService.getNotifications(userId)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('notification-1')
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should get unread notifications', async () => {
      // Arrange
      const userId = 'test-user-id'

      // Act
      const result = await notificationService.getNotifications(userId, { isRead: false })

      // Assert
      expect(result).toHaveLength(1)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
    })

    it('should get notifications by type', async () => {
      // Arrange
      const userId = 'test-user-id'
      const type = 'receipt_uploaded' as const

      // Act
      const result = await notificationService.getNotifications(userId, { type })

      // Assert
      expect(result).toHaveLength(1)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId, type },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
    })
  })

  // ============================================================================
  // NOTIFICATION UPDATE TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Notification Updates', () => {
    it('should mark notification as read', async () => {
      // Arrange
      const userId = 'test-user-id'
      const notificationId = 'notification-1'

      // Act
      await notificationService.markAsRead(notificationId, userId)

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: notificationId,
          userId,
        },
        data: { isRead: true },
      })
    })

    it('should mark all notifications as read', async () => {
      // Arrange
      const userId = 'test-user-id'

      // Act
      await notificationService.markAllAsRead(userId)

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
    })
  })

  // ============================================================================
  // NOTIFICATION DELETION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Notification Deletion', () => {
    it('should delete notification', async () => {
      // Arrange
      const userId = 'test-user-id'
      const notificationId = 'notification-1'

      // Act
      await notificationService.deleteNotification(notificationId, userId)

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          id: notificationId,
          userId,
        },
      })
    })
  })

  // ============================================================================
  // NOTIFICATION COUNT TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Notification Counts', () => {
    it('should get unread notification count', async () => {
      // Arrange
      const userId = 'test-user-id'

      // Act
      const result = await notificationService.getUnreadCount(userId)

      // Assert
      expect(result).toBe(1)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId, isRead: false },
      })
    })
  })

  // ============================================================================
  // PREFERENCES TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Notification Preferences', () => {
    it('should get user preferences', async () => {
      // Arrange
      const userId = 'test-user-id'

      // Act
      const result = await notificationService.getPreferences(userId)

      // Assert
      expect(result).toBeDefined()
      expect(result.userId).toBe('test-user-id')
      expect(result.emailNotifications).toBe(true)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notificationPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId },
      })
    })

    it('should create default preferences if none exist', async () => {
      // Arrange
      // Override global mock to simulate no preferences
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.notificationPreferences.findUnique = jest.fn().mockResolvedValue(null)

      const userId = 'test-user-id'

      // Act
      const result = await notificationService.getPreferences(userId)

      // Assert
      expect(result).toBeDefined()
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma: prisma2 } = require('@/lib/prisma')
      expect(prisma2.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: {},
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
        },
      })
    })

    it('should update user preferences', async () => {
      // Arrange
      const userId = 'test-user-id'
      const preferences = {
        emailNotifications: false,
        pushNotifications: true,
      }

      // Act
      const result = await notificationService.updatePreferences(userId, preferences)

      // Assert
      expect(result).toBeDefined()
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: preferences,
        create: expect.objectContaining({
          userId,
          ...preferences,
        }),
      })
    })
  })

  // ============================================================================
  // SPECIALIZED NOTIFICATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Specialized Notifications', () => {
    it('should send receipt uploaded notification', async () => {
      // Arrange
      const userId = 'test-user-id'
      const receiptId = 'receipt-123'
      const merchant = 'Walmart'

      // Act
      const result = await notificationService.notifyReceiptUploaded(userId, receiptId, merchant)

      // Assert
      expect(result).toBeDefined()
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId,
          type: 'receipt_uploaded',
          title: 'Receipt Uploaded',
          message: `Receipt from ${merchant} has been uploaded and is being processed.`,
        },
      })
    })

    it('should handle notification creation errors', async () => {
      // Arrange
      // Override global mock to simulate database error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.user.findUnique = jest.fn().mockRejectedValue(new Error('Database error'))

      const userId = 'test-user-id'
      const receiptId = 'receipt-123'
      const merchant = 'Walmart'

      // Act & Assert
      await expect(notificationService.notifyReceiptUploaded(userId, receiptId, merchant)).rejects.toThrow()
    })
  })
}) 