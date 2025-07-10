// ============================================================================
// ERROR TOAST TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing Strategy)
// ============================================================================
// Comprehensive tests for error toast functionality
// Follows master guide: Unit Testing Strategy, Component Testing

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorToast, ErrorType } from '../ErrorToast'

// ============================================================================
// TEST UTILITIES (see master guide: Testing Strategy)
// ============================================================================

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn()
}
Object.assign(navigator, { clipboard: mockClipboard })

// ============================================================================
// ERROR TOAST TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('ErrorToast', () => {
  const mockError = new Error('Test error message')
  mockError.stack = 'Test stack trace'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default error type', () => {
    render(
      <ErrorToast
        title="Test Error"
        message="Test error message"
      />
    )

    expect(screen.getByText('Test Error')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('renders different error types', () => {
    const { rerender } = render(
      <ErrorToast
        type="error"
        title="Error Title"
      />
    )

    expect(screen.getByText('Error Title')).toBeInTheDocument()

    // Warning type
    rerender(
      <ErrorToast
        type="warning"
        title="Warning Title"
      />
    )
    expect(screen.getByText('Warning Title')).toBeInTheDocument()

    // Info type
    rerender(
      <ErrorToast
        type="info"
        title="Info Title"
      />
    )
    expect(screen.getByText('Info Title')).toBeInTheDocument()

    // Success type
    rerender(
      <ErrorToast
        type="success"
        title="Success Title"
      />
    )
    expect(screen.getByText('Success Title')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const mockDismiss = jest.fn()
    
    render(
      <ErrorToast
        title="Test Error"
        onDismiss={mockDismiss}
      />
    )

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissButton)
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })

  it('calls onRetry when retry button is clicked', () => {
    const mockRetry = jest.fn()
    
    render(
      <ErrorToast
        title="Test Error"
        onRetry={mockRetry}
      />
    )

    fireEvent.click(screen.getByText('Retry'))
    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('renders custom actions when provided', () => {
    const mockAction1 = jest.fn()
    const mockAction2 = jest.fn()
    
    render(
      <ErrorToast
        title="Test Error"
        actions={[
          {
            label: 'Custom Action 1',
            onClick: mockAction1,
            variant: 'default'
          },
          {
            label: 'Custom Action 2',
            onClick: mockAction2,
            variant: 'outline'
          }
        ]}
      />
    )

    expect(screen.getByText('Custom Action 1')).toBeInTheDocument()
    expect(screen.getByText('Custom Action 2')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Custom Action 1'))
    expect(mockAction1).toHaveBeenCalledTimes(1)
    
    fireEvent.click(screen.getByText('Custom Action 2'))
    expect(mockAction2).toHaveBeenCalledTimes(1)
  })

  it('renders action icons when provided', () => {
    const mockAction = jest.fn()
    
    render(
      <ErrorToast
        title="Test Error"
        actions={[
          {
            label: 'Action with Icon',
            onClick: mockAction,
            icon: <div data-testid="action-icon">⚡</div>
          }
        ]}
      />
    )

    expect(screen.getByTestId('action-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ErrorToast
        title="Test Error"
        className="custom-error-toast"
      />
    )

    const container = screen.getByText('Test Error').closest('.custom-error-toast')
    expect(container).toBeInTheDocument()
  })

  it('handles missing error gracefully', () => {
    render(
      <ErrorToast
        title="Test Error"
        showErrorDetails={true}
      />
    )

    expect(screen.queryByText('Show error details')).not.toBeInTheDocument()
  })
})

// ============================================================================
// ERROR TYPE TESTS (see master guide: Component Testing)
// ============================================================================

describe('ErrorType', () => {
  it('supports all error types', () => {
    const errorTypes: ErrorType[] = ['error', 'warning', 'info', 'success']
    
    errorTypes.forEach(type => {
      render(
        <ErrorToast
          type={type}
          title={`${type} title`}
        />
      )
      
      expect(screen.getByText(`${type} title`)).toBeInTheDocument()
    })
  })
})

// ============================================================================
// ACCESSIBILITY TESTS (see master guide: Component Testing)
// ============================================================================

describe('ErrorToast Accessibility', () => {
  it('has proper ARIA labels for dismiss button', () => {
    render(
      <ErrorToast
        title="Test Error"
        onDismiss={jest.fn()}
      />
    )

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    expect(dismissButton).toBeInTheDocument()
  })

  it('has proper ARIA labels for retry button', () => {
    render(
      <ErrorToast
        title="Test Error"
        onRetry={jest.fn()}
      />
    )

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
  })
}) 