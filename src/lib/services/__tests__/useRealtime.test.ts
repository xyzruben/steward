// ============================================================================
// USE REALTIME HOOK TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for React hook integration with real-time service
// Follows master guide: Component Testing, Unit Testing Strategy

import { renderHook, act, waitFor } from '@testing-library/react'
import { useRealtime } from '@/hooks/useRealtime'
import { RealtimeService } from '../realtime'

// ============================================================================
// MOCK SETUP (see master guide: Mocking Practices)
// ============================================================================

// Mock the RealtimeService
jest.mock('../realtime', () => ({
  RealtimeService: jest.fn(),
  realtimeService: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getConnectionStatus: jest.fn().mockReturnValue(false),
    getActiveChannels: jest.fn().mockReturnValue([]),
    broadcastAnalyticsUpdate: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock RealtimeService instance
const mockRealtimeService = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getConnectionStatus: jest.fn().mockReturnValue(false),
  getActiveChannels: jest.fn().mockReturnValue([]),
  broadcastAnalyticsUpdate: jest.fn().mockResolvedValue(undefined),
}

// ============================================================================
// TEST SUITE (see master guide: Component Testing)
// ============================================================================

describe('useRealtime', () => {
  const mockUserId = 'test-user-id'
  const mockUser = { id: mockUserId }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup mock AuthContext
    const { useAuth } = require('@/context/AuthContext')
    useAuth.mockReturnValue({ user: mockUser })
    
    // Setup mock RealtimeService
    const { realtimeService } = require('../realtime')
    Object.assign(realtimeService, mockRealtimeService)
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // HOOK INITIALIZATION TESTS
  // ============================================================================

  describe('Hook Initialization', () => {
    test('should initialize with default state', () => {
      // Act
      const { result } = renderHook(() => useRealtime())

      // Assert
      expect(result.current.notifications).toEqual([])
      expect(result.current.isConnected).toBe(false)
      expect(result.current.clearNotifications).toBeInstanceOf(Function)
      expect(result.current.broadcastAnalyticsUpdate).toBeInstanceOf(Function)
    })

    test('should connect to real-time service when user is available', async () => {
      // Act
      renderHook(() => useRealtime())

      // Assert
      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalledWith(mockUserId)
      })
    })

    test('should not connect when user is not available', () => {
      // Arrange
      const { useAuth } = require('@/context/AuthContext')
      useAuth.mockReturnValue({ user: null })

      // Act
      renderHook(() => useRealtime())

      // Assert
      expect(mockRealtimeService.connect).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // CONNECTION MANAGEMENT TESTS
  // ============================================================================

  describe('Connection Management', () => {
    test('should connect to real-time service on mount', async () => {
      // Act
      renderHook(() => useRealtime())

      // Assert
      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalledWith(mockUserId)
      })
    })

    test('should disconnect on unmount', async () => {
      // Act
      const { unmount } = renderHook(() => useRealtime())
      
      // Wait for connection to be established
      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalled()
      })

      // Unmount
      unmount()

      // Assert
      expect(mockRealtimeService.disconnect).toHaveBeenCalled()
    })

    test('should update connection status when service connects', async () => {
      // Arrange
      mockRealtimeService.getConnectionStatus.mockReturnValue(true)

      // Act
      const { result } = renderHook(() => useRealtime())

      // Assert
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })
    })

    test('should handle connection errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockRealtimeService.connect.mockRejectedValueOnce(new Error('Connection failed'))

      // Act
      const { result } = renderHook(() => useRealtime())

      // Assert
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('useRealtime: Connection failed:', expect.any(Error))
        expect(result.current.isConnected).toBe(false)
      })

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  // ============================================================================
  // EVENT LISTENER TESTS
  // ============================================================================

  describe('Event Listeners', () => {
    test('should register event listeners on mount', async () => {
      // Act
      renderHook(() => useRealtime())

      // Assert
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).toHaveBeenCalledWith('receipt_uploaded', expect.any(Function))
        expect(mockRealtimeService.addEventListener).toHaveBeenCalledWith('receipt_processed', expect.any(Function))
        expect(mockRealtimeService.addEventListener).toHaveBeenCalledWith('analytics_updated', expect.any(Function))
      })
    })

    test('should remove event listeners on unmount', async () => {
      // Act
      const { unmount } = renderHook(() => useRealtime())
      
      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).toHaveBeenCalled()
      })

      // Unmount
      unmount()

      // Assert
      expect(mockRealtimeService.removeEventListener).toHaveBeenCalledWith('receipt_uploaded', expect.any(Function))
      expect(mockRealtimeService.removeEventListener).toHaveBeenCalledWith('receipt_processed', expect.any(Function))
      expect(mockRealtimeService.removeEventListener).toHaveBeenCalledWith('analytics_updated', expect.any(Function))
    })

    test('should add notifications when events are received', async () => {
      // Arrange
      let receiptCallback: Function
      mockRealtimeService.addEventListener.mockImplementation((event, callback) => {
        if (event === 'receipt_uploaded') {
          receiptCallback = callback
        }
      })

      // Act
      const { result } = renderHook(() => useRealtime())

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).toHaveBeenCalled()
      })

      // Simulate receipt upload event
      act(() => {
        receiptCallback!({
          type: 'receipt_uploaded',
          userId: mockUserId,
          data: {
            receiptId: 'receipt-123',
            message: 'New receipt uploaded',
            timestamp: '2024-01-01T00:00:00Z',
          },
        })
      })

      // Assert
      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0]).toEqual({
        type: 'receipt_uploaded',
        userId: mockUserId,
        data: {
          receiptId: 'receipt-123',
          message: 'New receipt uploaded',
          timestamp: '2024-01-01T00:00:00Z',
        },
      })
    })

    test('should handle multiple notifications', async () => {
      // Arrange
      let receiptCallback: Function
      let analyticsCallback: Function
      mockRealtimeService.addEventListener.mockImplementation((event, callback) => {
        if (event === 'receipt_uploaded') {
          receiptCallback = callback
        } else if (event === 'analytics_updated') {
          analyticsCallback = callback
        }
      })

      // Act
      const { result } = renderHook(() => useRealtime())

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).toHaveBeenCalled()
      })

      // Simulate multiple events
      act(() => {
        receiptCallback!({
          type: 'receipt_uploaded',
          userId: mockUserId,
          data: {
            receiptId: 'receipt-123',
            message: 'New receipt uploaded',
            timestamp: '2024-01-01T00:00:00Z',
          },
        })

        analyticsCallback!({
          type: 'analytics_updated',
          userId: mockUserId,
          data: {
            message: 'Analytics updated',
            timestamp: '2024-01-01T00:01:00Z',
          },
        })
      })

      // Assert - Order doesn't matter, just check both are present
      expect(result.current.notifications).toHaveLength(2)
      const notificationTypes = result.current.notifications.map(n => n.type)
      expect(notificationTypes).toContain('receipt_uploaded')
      expect(notificationTypes).toContain('analytics_updated')
    })
  })

  // ============================================================================
  // NOTIFICATION MANAGEMENT TESTS
  // ============================================================================

  describe('Notification Management', () => {
    test('should clear all notifications', async () => {
      // Arrange
      let receiptCallback: Function
      let analyticsCallback: Function
      mockRealtimeService.addEventListener.mockImplementation((event, callback) => {
        if (event === 'receipt_uploaded') {
          receiptCallback = callback
        } else if (event === 'analytics_updated') {
          analyticsCallback = callback
        }
      })

      const { result } = renderHook(() => useRealtime())

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).toHaveBeenCalled()
      })

      // Add multiple notifications
      act(() => {
        receiptCallback!({
          type: 'receipt_uploaded',
          userId: mockUserId,
          data: {
            receiptId: 'receipt-123',
            message: 'New receipt uploaded',
            timestamp: '2024-01-01T00:00:00Z',
          },
        })

        analyticsCallback!({
          type: 'analytics_updated',
          userId: mockUserId,
          data: {
            message: 'Analytics updated',
            timestamp: '2024-01-01T00:01:00Z',
          },
        })
      })

      // Act - Clear all notifications
      act(() => {
        result.current.clearNotifications()
      })

      // Assert
      expect(result.current.notifications).toHaveLength(0)
    })

    test('should limit notifications to last 10', async () => {
      // Arrange
      let receiptCallback: Function
      mockRealtimeService.addEventListener.mockImplementation((event, callback) => {
        if (event === 'receipt_uploaded') {
          receiptCallback = callback
        }
      })

      const { result } = renderHook(() => useRealtime())

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).toHaveBeenCalled()
      })

      // Add 12 notifications
      act(() => {
        for (let i = 0; i < 12; i++) {
          receiptCallback!({
            type: 'receipt_uploaded',
            userId: mockUserId,
            data: {
              receiptId: `receipt-${i}`,
              message: `Receipt ${i} uploaded`,
              timestamp: '2024-01-01T00:00:00Z',
            },
          })
        }
      })

      // Assert - Should only keep last 10
      expect(result.current.notifications).toHaveLength(10)
      expect(result.current.notifications[0].data.receiptId).toBe('receipt-11')
      expect(result.current.notifications[9].data.receiptId).toBe('receipt-2')
    })
  })

  // ============================================================================
  // BROADCASTING TESTS
  // ============================================================================

  describe('Broadcasting', () => {
    test('should broadcast analytics updates', async () => {
      // Act
      const { result } = renderHook(() => useRealtime())

      // Wait for hook to initialize
      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalled()
      })

      // Act - Broadcast analytics update
      await act(async () => {
        await result.current.broadcastAnalyticsUpdate()
      })

      // Assert
      expect(mockRealtimeService.broadcastAnalyticsUpdate).toHaveBeenCalledWith(mockUserId)
    })

    test('should handle broadcast errors gracefully', async () => {
      // Arrange
      mockRealtimeService.broadcastAnalyticsUpdate.mockRejectedValueOnce(new Error('Broadcast failed'))

      // Act
      const { result } = renderHook(() => useRealtime())

      // Wait for hook to initialize
      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalled()
      })

      // Act - Broadcast analytics update should not throw
      await expect(result.current.broadcastAnalyticsUpdate()).rejects.toThrow('Broadcast failed')
    })
  })

  // ============================================================================
  // OPTIONS TESTS
  // ============================================================================

  describe('Options', () => {
    test('should respect enableReceiptUpdates option', async () => {
      // Act
      renderHook(() => useRealtime({ enableReceiptUpdates: false }))

      // Assert
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).not.toHaveBeenCalledWith('receipt_uploaded', expect.any(Function))
        expect(mockRealtimeService.addEventListener).not.toHaveBeenCalledWith('receipt_processed', expect.any(Function))
      })
    })

    test('should respect enableAnalyticsUpdates option', async () => {
      // Act
      renderHook(() => useRealtime({ enableAnalyticsUpdates: false }))

      // Assert
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).not.toHaveBeenCalledWith('analytics_updated', expect.any(Function))
      })
    })

    test('should call custom callbacks when provided', async () => {
      // Arrange
      const mockOnReceiptUploaded = jest.fn()
      const mockOnAnalyticsUpdated = jest.fn()

      let receiptCallback: Function
      let analyticsCallback: Function
      mockRealtimeService.addEventListener.mockImplementation((event, callback) => {
        if (event === 'receipt_uploaded') {
          receiptCallback = callback
        } else if (event === 'analytics_updated') {
          analyticsCallback = callback
        }
      })

      // Act
      renderHook(() => useRealtime({
        onReceiptUploaded: mockOnReceiptUploaded,
        onAnalyticsUpdated: mockOnAnalyticsUpdated,
      }))

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).toHaveBeenCalled()
      })

      // Simulate events
      act(() => {
        receiptCallback!({
          type: 'receipt_uploaded',
          userId: mockUserId,
          data: { receiptId: 'receipt-123' },
        })

        analyticsCallback!({
          type: 'analytics_updated',
          userId: mockUserId,
          data: { message: 'Analytics updated' },
        })
      })

      // Assert
      expect(mockOnReceiptUploaded).toHaveBeenCalledWith({
        type: 'receipt_uploaded',
        userId: mockUserId,
        data: { receiptId: 'receipt-123' },
      })
      expect(mockOnAnalyticsUpdated).toHaveBeenCalledWith({
        type: 'analytics_updated',
        userId: mockUserId,
        data: { message: 'Analytics updated' },
      })
    })
  })

  // ============================================================================
  // MEMORY LEAK PREVENTION TESTS
  // ============================================================================

  describe('Memory Leak Prevention', () => {
    test('should cleanup event listeners on unmount', async () => {
      // Act
      const { unmount } = renderHook(() => useRealtime())
      
      // Wait for listeners to be registered
      await waitFor(() => {
        expect(mockRealtimeService.addEventListener).toHaveBeenCalled()
      })

      // Unmount
      unmount()

      // Assert
      expect(mockRealtimeService.removeEventListener).toHaveBeenCalledTimes(3) // receipt_uploaded, receipt_processed, analytics_updated
      expect(mockRealtimeService.disconnect).toHaveBeenCalled()
    })

    test('should not create memory leaks with multiple renders', async () => {
      // Act
      const { result, rerender } = renderHook(() => useRealtime())
      
      // Wait for initial setup
      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalled()
      })

      // Rerender multiple times
      rerender()
      rerender()
      rerender()

      // Assert - Should only connect once
      expect(mockRealtimeService.connect).toHaveBeenCalledTimes(1)
      expect(mockRealtimeService.addEventListener).toHaveBeenCalledTimes(3) // Only once per event type
    })
  })

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    test('should handle user changes', async () => {
      // Arrange
      const { useAuth } = require('@/context/AuthContext')
      useAuth.mockReturnValue({ user: { id: 'user-1' } })

      const { result, rerender } = renderHook(() => useRealtime())

      // Wait for initial connection
      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalledWith('user-1')
      })

      // Change user
      useAuth.mockReturnValue({ user: { id: 'user-2' } })
      rerender()

      // Assert - Should disconnect from old user and connect to new user
      expect(mockRealtimeService.disconnect).toHaveBeenCalled()
      await waitFor(() => {
        expect(mockRealtimeService.connect).toHaveBeenCalledWith('user-2')
      })
    })

    test('should handle service method errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockRealtimeService.getConnectionStatus.mockImplementation(() => {
        throw new Error('Service error')
      })

      // Act
      const { result } = renderHook(() => useRealtime())

      // Assert - Should handle error gracefully
      expect(result.current.isConnected).toBe(false)

      // Cleanup
      consoleSpy.mockRestore()
    })
  })
}) 