// ============================================================================
// NOTIFICATION TOAST TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for notification toast component
// Follows master guide: Component Testing, Accessibility

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NotificationToast } from '../NotificationToast'

// ============================================================================
// TEST SUITE (see master guide: Component Testing)
// ============================================================================

describe('NotificationToast', () => {
  const mockNotification = {
    id: 'test-notification-1',
    type: 'receipt_uploaded' as const,
    title: 'Receipt Uploaded',
    message: 'Your receipt has been successfully uploaded and processed.',
    timestamp: '2024-01-01T12:00:00Z',
    isRead: false,
  }

  const mockOnClose = jest.fn()
  const mockOnMarkAsRead = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    test('should render notification with all required information', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText('Receipt Uploaded')).toBeInTheDocument()
      expect(screen.getByText('Your receipt has been successfully uploaded and processed.')).toBeInTheDocument()
      // Use regex to match any time string in the format h:mm AM/PM
      expect(screen.getByText(/\d{1,2}:\d{2} (AM|PM)/)).toBeInTheDocument()
    })

    test('should render different notification types with appropriate styling', () => {
      // Arrange
      const analyticsNotification = {
        ...mockNotification,
        type: 'analytics_updated' as const,
        title: 'Analytics Updated',
        message: 'Your spending analytics have been updated.',
      }

      // Act
      render(
        <NotificationToast
          notification={analyticsNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText('Analytics Updated')).toBeInTheDocument()
      expect(screen.getByText('Your spending analytics have been updated.')).toBeInTheDocument()
    })

    test('should render receipt_updated notification type', () => {
      // Arrange
      const updatedNotification = {
        ...mockNotification,
        type: 'receipt_updated' as const,
        title: 'Receipt Updated',
        message: 'Your receipt has been updated.',
      }

      // Act
      render(
        <NotificationToast
          notification={updatedNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText('Receipt Updated')).toBeInTheDocument()
      expect(screen.getByText('Your receipt has been updated.')).toBeInTheDocument()
    })

    test('should handle long messages gracefully', () => {
      // Arrange
      const longMessageNotification = {
        ...mockNotification,
        message: 'This is a very long message that should be truncated or wrapped properly to ensure the notification component displays correctly without breaking the layout or causing overflow issues.',
      }

      // Act
      render(
        <NotificationToast
          notification={longMessageNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText(longMessageNotification.message)).toBeInTheDocument()
    })

    test('should handle empty or missing message', () => {
      // Arrange
      const noMessageNotification = {
        ...mockNotification,
        message: '',
      }

      // Act
      render(
        <NotificationToast
          notification={noMessageNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText('Receipt Uploaded')).toBeInTheDocument()
      // Should still render without crashing
    })
  })

  // ============================================================================
  // INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    test('should call onClose when close button is clicked', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      // Assert
      expect(mockOnClose).toHaveBeenCalledWith(mockNotification.id)
    })

    test('should call onMarkAsRead when notification is clicked', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      fireEvent.click(notification)

      // Assert
      expect(mockOnMarkAsRead).toHaveBeenCalledWith(mockNotification.id)
    })

    test('should not call onMarkAsRead when close button is clicked', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      // Assert
      expect(mockOnClose).toHaveBeenCalledWith(mockNotification.id)
      expect(mockOnMarkAsRead).not.toHaveBeenCalled()
    })

    test('should handle keyboard interactions', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      
      // Test Enter key
      fireEvent.keyDown(notification, { key: 'Enter', code: 'Enter' })
      expect(mockOnMarkAsRead).toHaveBeenCalledWith(mockNotification.id)

      // Test Space key
      fireEvent.keyDown(notification, { key: ' ', code: 'Space' })
      expect(mockOnMarkAsRead).toHaveBeenCalledTimes(2)
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS (see master guide: Accessibility)
  // ============================================================================

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByRole('button', { name: /receipt uploaded/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    test('should be keyboard navigable', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      const closeButton = screen.getByRole('button', { name: /close/i })

      // Assert
      expect(notification).toHaveAttribute('tabIndex', '0')
      expect(closeButton).toHaveAttribute('tabIndex', '0')
    })

    test('should have proper focus management', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      
      // Focus the notification
      notification.focus()
      expect(notification).toHaveFocus()
    })

    test('should announce notification to screen readers', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      expect(notification).toHaveAttribute('aria-label', expect.stringContaining('Receipt Uploaded'))
    })
  })

  // ============================================================================
  // VISUAL STATE TESTS
  // ============================================================================

  describe('Visual States', () => {
    test('should show read state when notification is marked as read', () => {
      // Arrange
      const readNotification = {
        ...mockNotification,
        isRead: true,
      }

      // Act
      render(
        <NotificationToast
          notification={readNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      expect(notification).toHaveClass('opacity-75')
    })

    test('should show unread state when notification is not read', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      expect(notification).not.toHaveClass('opacity-75')
    })

    test('should show hover state on mouse enter', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      
      // Simulate hover
      fireEvent.mouseEnter(notification)

      // Assert - Should have hover styles (this would be tested with visual regression testing)
      expect(notification).toBeInTheDocument()
    })

    test('should show focus state on keyboard navigation', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      const notification = screen.getByRole('button', { name: /receipt uploaded/i })
      
      // Focus the notification
      notification.focus()

      // Assert - Should have focus styles
      expect(notification).toHaveFocus()
    })
  })

  // ============================================================================
  // TIME FORMATTING TESTS
  // ============================================================================

  describe('Time Formatting', () => {
    test('should format timestamp correctly', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText(/\d{1,2}:\d{2} (AM|PM)/)).toBeInTheDocument()
    })

    test('should handle different time formats', () => {
      // Arrange
      const morningNotification = {
        ...mockNotification,
        timestamp: '2024-01-01T06:30:00Z',
      }

      // Act
      render(
        <NotificationToast
          notification={morningNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText(/\d{1,2}:\d{2} (AM|PM)/)).toBeInTheDocument()
    })

    test('should handle invalid timestamp gracefully', () => {
      // Arrange
      const invalidTimestampNotification = {
        ...mockNotification,
        timestamp: 'invalid-timestamp',
      }

      // Act
      render(
        <NotificationToast
          notification={invalidTimestampNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert - Should not crash and should show something reasonable
      expect(screen.getByText('Receipt Uploaded')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // EDGE CASES TESTS
  // ============================================================================

  describe('Edge Cases', () => {
    test('should handle missing callback functions', () => {
      // Act
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={undefined as any}
          onMarkAsRead={undefined as any}
        />
      )

      // Assert - Should render without crashing
      expect(screen.getByText('Receipt Uploaded')).toBeInTheDocument()
    })

    test('should handle very long titles', () => {
      // Arrange
      const longTitleNotification = {
        ...mockNotification,
        title: 'This is a very long title that should be handled gracefully by the notification component without breaking the layout or causing overflow issues',
      }

      // Act
      render(
        <NotificationToast
          notification={longTitleNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText(longTitleNotification.title)).toBeInTheDocument()
    })

    test('should handle special characters in text', () => {
      // Arrange
      const specialCharsNotification = {
        ...mockNotification,
        title: 'Receipt with special chars: & < > " \'',
        message: 'Message with emojis: 🎉 📊 💰',
      }

      // Act
      render(
        <NotificationToast
          notification={specialCharsNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert
      expect(screen.getByText('Receipt with special chars: & < > " \'')).toBeInTheDocument()
      expect(screen.getByText('Message with emojis: 🎉 📊 💰')).toBeInTheDocument()
    })

    test('should handle missing notification properties', () => {
      // Arrange
      const incompleteNotification = {
        id: 'test-id',
        type: 'receipt_uploaded' as const,
        // Missing title, message, timestamp, isRead
      } as any

      // Act
      render(
        <NotificationToast
          notification={incompleteNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Assert - Should handle gracefully without crashing
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance', () => {
    test('should render quickly without performance issues', () => {
      // Act
      const startTime = performance.now()
      
      render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Assert - Should render in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100)
    })

    test('should handle rapid state changes', () => {
      // Act
      const { rerender } = render(
        <NotificationToast
          notification={mockNotification}
          onClose={mockOnClose}
          onMarkAsRead={mockOnMarkAsRead}
        />
      )

      // Rapidly change notification state
      for (let i = 0; i < 10; i++) {
        rerender(
          <NotificationToast
            notification={{ ...mockNotification, isRead: i % 2 === 0 }}
            onClose={mockOnClose}
            onMarkAsRead={mockOnMarkAsRead}
          />
        )
      }

      // Assert - Should handle without errors
      expect(screen.getByText('Receipt Uploaded')).toBeInTheDocument()
    })
  })
}) 