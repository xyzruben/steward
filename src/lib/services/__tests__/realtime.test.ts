// ============================================================================
// REALTIME SERVICE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for real-time WebSocket functionality
// Follows master guide: Unit Testing Strategy, Mocking Practices

import { RealtimeService, type RealtimeNotification } from '../realtime'
import { createSupabaseBrowserClient } from '@/lib/supabase'

// ============================================================================
// MOCK SETUP (see master guide: Mocking Practices)
// ============================================================================

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createSupabaseBrowserClient: jest.fn(),
}))

// Mock Supabase channel
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue(undefined),
}

// Mock Supabase client
const mockSupabase = {
  channel: jest.fn().mockReturnValue(mockChannel),
  removeChannel: jest.fn().mockResolvedValue(undefined),
}

// ============================================================================
// TEST SUITE (see master guide: Unit Testing Strategy)
// ============================================================================

describe('RealtimeService', () => {
  let realtimeService: RealtimeService
  const mockUserId = 'test-user-id'

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup mock Supabase client
    ;(createSupabaseBrowserClient as jest.Mock).mockReturnValue(mockSupabase)
    
    // Create fresh service instance
    realtimeService = new RealtimeService()
  })

  afterEach(() => {
    // Cleanup
    realtimeService.disconnect()
  })

  // ============================================================================
  // CONNECTION MANAGEMENT TESTS
  // ============================================================================

  describe('Connection Management', () => {
    test('should connect successfully for a user', async () => {
      // Act
      await realtimeService.connect(mockUserId)

      // Assert
      expect(mockSupabase.channel).toHaveBeenCalledWith(`receipts:${mockUserId}`)
      expect(mockSupabase.channel).toHaveBeenCalledWith(`analytics:${mockUserId}`)
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(2)
      expect(realtimeService.getConnectionStatus()).toBe(true)
    })

    test('should not connect twice for the same user', async () => {
      // Arrange
      await realtimeService.connect(mockUserId)
      const initialCallCount = mockSupabase.channel.mock.calls.length

      // Act
      await realtimeService.connect(mockUserId)

      // Assert
      expect(mockSupabase.channel).toHaveBeenCalledTimes(initialCallCount)
      expect(realtimeService.getConnectionStatus()).toBe(true)
    })

    test('should disconnect all channels', async () => {
      // Arrange
      await realtimeService.connect(mockUserId)

      // Act
      await realtimeService.disconnect()

      // Assert
      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(2)
      expect(realtimeService.getConnectionStatus()).toBe(false)
      expect(realtimeService.getActiveChannels()).toHaveLength(0)
    })

    test('should handle connection errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockChannel.subscribe.mockRejectedValueOnce(new Error('Connection failed'))

      // Act
      await realtimeService.connect(mockUserId)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('RealtimeService: Connection failed:', expect.any(Error))
      expect(realtimeService.getConnectionStatus()).toBe(false)

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  // ============================================================================
  // EVENT LISTENER TESTS
  // ============================================================================

  describe('Event Listeners', () => {
    test('should add and remove event listeners', () => {
      // Arrange
      const mockCallback = jest.fn()

      // Act
      realtimeService.addEventListener('receipt_uploaded', mockCallback)
      realtimeService.removeEventListener('receipt_uploaded', mockCallback)

      // Assert
      // Note: We can't easily test the internal listener map, but we can test that
      // the methods don't throw errors and the service remains stable
      expect(realtimeService.getConnectionStatus()).toBe(false)
    })

    test('should notify listeners when events occur', async () => {
      // Arrange
      const mockCallback = jest.fn()
      realtimeService.addEventListener('receipt_uploaded', mockCallback)
      await realtimeService.connect(mockUserId)

      // Act - Simulate a receipt upload event
      const mockPayload = { new: { id: 'receipt-123' } }
      const receiptCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].event === 'INSERT'
      )?.[2]

      if (receiptCallback) {
        receiptCallback(mockPayload)
      }

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'receipt_uploaded',
        userId: mockUserId,
        data: {
          receiptId: 'receipt-123',
          message: 'New receipt uploaded',
          timestamp: expect.any(String),
        },
      })
    })

    test('should handle multiple listeners for the same event', () => {
      // Arrange
      const mockCallback1 = jest.fn()
      const mockCallback2 = jest.fn()

      // Act
      realtimeService.addEventListener('receipt_uploaded', mockCallback1)
      realtimeService.addEventListener('receipt_uploaded', mockCallback2)

      // Assert - Both listeners should be registered without errors
      expect(realtimeService.getConnectionStatus()).toBe(false)
    })
  })

  // ============================================================================
  // CHANNEL SUBSCRIPTION TESTS
  // ============================================================================

  describe('Channel Subscriptions', () => {
    test('should subscribe to receipts channel with correct filters', async () => {
      // Act
      await realtimeService.connect(mockUserId)

      // Assert
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'receipts',
          filter: `userId=eq.${mockUserId}`,
        },
        expect.any(Function)
      )

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'receipts',
          filter: `userId=eq.${mockUserId}`,
        },
        expect.any(Function)
      )
    })

    test('should subscribe to analytics channel for broadcasts', async () => {
      // Act
      await realtimeService.connect(mockUserId)

      // Assert
      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'analytics_updated' },
        expect.any(Function)
      )
    })

    test('should handle subscription errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockChannel.subscribe.mockRejectedValueOnce(new Error('Subscription failed'))

      // Act
      await realtimeService.connect(mockUserId)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('RealtimeService: Connection failed:', expect.any(Error))

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  // ============================================================================
  // BROADCASTING TESTS
  // ============================================================================

  describe('Broadcasting', () => {
    test('should broadcast analytics updates', async () => {
      // Arrange
      await realtimeService.connect(mockUserId)

      // Act
      await realtimeService.broadcastAnalyticsUpdate(mockUserId)

      // Assert
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'analytics_updated',
        payload: {
          userId: mockUserId,
          timestamp: expect.any(String),
        },
      })
    })

    test('should handle broadcast errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockChannel.send.mockRejectedValueOnce(new Error('Broadcast failed'))
      await realtimeService.connect(mockUserId)

      // Act
      await realtimeService.broadcastAnalyticsUpdate(mockUserId)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('RealtimeService: Error broadcasting analytics update:', expect.any(Error))

      // Cleanup
      consoleSpy.mockRestore()
    })

    test('should not broadcast if channel is not available', async () => {
      // Act
      await realtimeService.broadcastAnalyticsUpdate(mockUserId)

      // Assert
      expect(mockChannel.send).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // CONFIGURATION TESTS
  // ============================================================================

  describe('Configuration', () => {
    test('should use default configuration', () => {
      // Act
      const service = new RealtimeService()

      // Assert
      expect(service.getConnectionStatus()).toBe(false)
      expect(service.getActiveChannels()).toHaveLength(0)
    })

    test('should accept custom configuration', () => {
      // Arrange
      const customConfig = {
        enableNotifications: false,
        enableAnalytics: false,
        reconnectInterval: 10000,
      }

      // Act
      const service = new RealtimeService(customConfig)

      // Assert
      expect(service.getConnectionStatus()).toBe(false)
    })
  })

  // ============================================================================
  // UTILITY METHOD TESTS
  // ============================================================================

  describe('Utility Methods', () => {
    test('should return correct connection status', async () => {
      // Assert - Initially disconnected
      expect(realtimeService.getConnectionStatus()).toBe(false)

      // Act - Connect
      await realtimeService.connect(mockUserId)

      // Assert - Now connected
      expect(realtimeService.getConnectionStatus()).toBe(true)
    })

    test('should return active channels', async () => {
      // Act
      await realtimeService.connect(mockUserId)

      // Assert
      const channels = realtimeService.getActiveChannels()
      expect(channels).toContain(`receipts:${mockUserId}`)
      expect(channels).toContain(`analytics:${mockUserId}`)
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    test('should handle listener callback errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const mockCallback = jest.fn().mockImplementation(() => {
        throw new Error('Listener error')
      })
      realtimeService.addEventListener('receipt_uploaded', mockCallback)
      await realtimeService.connect(mockUserId)

      // Act - Simulate event that triggers the error
      const receiptCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].event === 'INSERT'
      )?.[2]

      if (receiptCallback) {
        receiptCallback({ new: { id: 'receipt-123' } })
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('RealtimeService: Error in event listener:', expect.any(Error))

      // Cleanup
      consoleSpy.mockRestore()
    })

    test('should handle disconnect errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSupabase.removeChannel.mockRejectedValueOnce(new Error('Disconnect failed'))
      await realtimeService.connect(mockUserId)

      // Act
      await realtimeService.disconnect()

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('RealtimeService: Error disconnecting from receipts:test-user-id:', expect.any(Error))

      // Cleanup
      consoleSpy.mockRestore()
    })
  })
}) 