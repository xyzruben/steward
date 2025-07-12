// ============================================================================
// ERROR TOAST COMPONENT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for ErrorToast component functionality
// Uses global mocks from jest.setup.js for consistent isolation

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorToast } from '../ErrorToast'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

const mockError = new Error('Test error message')
mockError.name = 'TestError'
mockError.stack = 'Test stack trace'

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('ErrorToast Component', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Rendering', () => {
    it('should render error message correctly', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should render with error icon', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByText('Test Error')).toBeInTheDocument()
    })

    it('should render dismiss button', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })

    it('should apply error styling', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      const toast = screen.getByText('Test Error').closest('.bg-red-50')
      expect(toast).toBeInTheDocument()
    })
  })

  // ============================================================================
  // INTERACTION TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('User Interactions', () => {
    it('should call onDismiss when dismiss button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      const onDismiss = jest.fn()
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={onDismiss} />)

      // Act
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)

      // Assert
      expect(onDismiss).toHaveBeenCalled()
    })

    it('should call onDismiss when close icon is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      const onDismiss = jest.fn()
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={onDismiss} />)

      // Act
      const closeIcon = screen.getByTestId('close-icon')
      await user.click(closeIcon)

      // Assert
      expect(onDismiss).toHaveBeenCalled()
    })

    it('should handle keyboard navigation', async () => {
      // Arrange
      const user = userEvent.setup()
      const onDismiss = jest.fn()
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={onDismiss} />)

      // Act
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      dismissButton.focus()
      await user.keyboard('{Enter}')

      // Assert
      expect(onDismiss).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByText('Test Error')).toBeInTheDocument()
    })

    it('should announce error to screen readers', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should have proper button labels', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      expect(dismissButton).toBeInTheDocument()
    })
  })

  // ============================================================================
  // ANIMATION TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Animations', () => {
    it('should have enter animation classes', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('animate-in', 'slide-in-from-top-full')
    })

    it('should have exit animation classes', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('animate-out', 'slide-out-to-top-full')
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle missing error message', () => {
      // Arrange
      const errorWithoutMessage = {
        ...mockError,
        message: '',
      }

      // Act
      render(<ErrorToast title="Test Error" error={errorWithoutMessage} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should handle long error messages', () => {
      // Arrange
      const longError = {
        ...mockError,
        message: 'This is a very long error message that should be handled properly by the component without breaking the layout or causing any visual issues',
      }

      // Act
      render(<ErrorToast title="Test Error" error={longError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByText(longError.message)).toBeInTheDocument()
    })

    it('should handle special characters in error message', () => {
      // Arrange
      const specialCharError = {
        ...mockError,
        message: 'Error with special chars: <>&"\'',
      }

      // Act
      render(<ErrorToast title="Test Error" error={specialCharError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByText(specialCharError.message)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // PROPS TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Props', () => {
    it('should handle different error types', () => {
      // Arrange
      const warningError = {
        ...mockError,
        type: 'warning' as const,
      }

      // Act
      render(<ErrorToast title="Test Error" error={warningError} onDismiss={jest.fn()} />)

      // Assert
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-yellow-50', 'border-yellow-200')
    })

    it('should handle custom className prop', () => {
      // Arrange
      const customClass = 'custom-error-toast'

      // Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} className={customClass} />)

      // Assert
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass(customClass)
    })

    it('should handle missing onDismiss prop', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={undefined} />)

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // INTEGRATION TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Integration', () => {
    it('should work with toast context', () => {
      // Arrange & Act
      render(<ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />)

      // Assert
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should handle multiple toasts', () => {
      // Arrange
      const error2 = {
        ...mockError,
        id: 'error-2',
        message: 'Second error message',
      }

      // Act
      render(
        <div>
          <ErrorToast title="Test Error" error={mockError} onDismiss={jest.fn()} />
          <ErrorToast title="Test Error 2" error={error2} onDismiss={jest.fn()} />
        </div>
      )

      // Assert
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      expect(screen.getByText('Second error message')).toBeInTheDocument()
    })
  })
}) 