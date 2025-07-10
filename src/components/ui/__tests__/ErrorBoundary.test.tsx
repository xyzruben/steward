// ============================================================================
// ERROR BOUNDARY TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing Strategy)
// ============================================================================
// Comprehensive tests for error boundary functionality
// Follows master guide: Unit Testing Strategy, Component Testing

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, ErrorFallback, ErrorPage } from '../ErrorBoundary'

// ============================================================================
// TEST UTILITIES (see master guide: Testing Strategy)
// ============================================================================

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Normal component</div>
}

// Mock console.error to avoid noise in tests
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

// ============================================================================
// ERROR BOUNDARY TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error fallback when child throws error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('We encountered an unexpected error. Don\'t worry, your data is safe.')).toBeInTheDocument()
  })

  it('calls onError prop when error occurs', () => {
    const onError = jest.fn()
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  it('renders custom fallback when provided', () => {
    const CustomFallback = () => <div data-testid="custom-fallback">Custom error UI</div>
    
    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
  })
})

// ============================================================================
// ERROR FALLBACK TESTS (see master guide: Component Testing)
// ============================================================================

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message')
  const mockErrorInfo = { componentStack: 'Test component stack' }
  const mockHandlers = {
    onRetry: jest.fn(),
    onGoHome: jest.fn(),
    onGoBack: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders error information correctly', () => {
    render(
      <ErrorFallback
        error={mockError}
        errorInfo={mockErrorInfo}
        errorId="test-error-123"
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('We encountered an unexpected error. Don\'t worry, your data is safe.')).toBeInTheDocument()
  })

  it('calls retry handler when retry button is clicked', () => {
    render(
      <ErrorFallback
        error={mockError}
        errorInfo={mockErrorInfo}
        {...mockHandlers}
      />
    )

    fireEvent.click(screen.getByText('Try Again'))
    expect(mockHandlers.onRetry).toHaveBeenCalledTimes(1)
  })

  it('calls go back handler when go back button is clicked', () => {
    render(
      <ErrorFallback
        error={mockError}
        errorInfo={mockErrorInfo}
        {...mockHandlers}
      />
    )

    fireEvent.click(screen.getByText('Go Back'))
    expect(mockHandlers.onGoBack).toHaveBeenCalledTimes(1)
  })

  it('calls go home handler when go home button is clicked', () => {
    render(
      <ErrorFallback
        error={mockError}
        errorInfo={mockErrorInfo}
        {...mockHandlers}
      />
    )

    fireEvent.click(screen.getByText('Home'))
    expect(mockHandlers.onGoHome).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(
      <ErrorFallback
        error={mockError}
        errorInfo={mockErrorInfo}
        className="custom-class"
        {...mockHandlers}
      />
    )

    const container = screen.getByText('Oops! Something went wrong').closest('.custom-class')
    expect(container).toBeInTheDocument()
  })
})

// ============================================================================
// ERROR PAGE TESTS (see master guide: Component Testing)
// ============================================================================

describe('ErrorPage', () => {
  const mockActions = {
    action: {
      label: 'Go Home',
      onClick: jest.fn(),
      icon: <div data-testid="home-icon">🏠</div>
    },
    secondaryAction: {
      label: 'Go Back',
      onClick: jest.fn(),
      icon: <div data-testid="back-icon">⬅️</div>
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default props', () => {
    render(<ErrorPage />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    expect(screen.getByText('The page you\'re looking for doesn\'t exist or has been moved.')).toBeInTheDocument()
  })

  it('renders with custom props', () => {
    render(
      <ErrorPage
        code="500"
        title="Server Error"
        message="Something went wrong on our end."
      />
    )

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('Server Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong on our end.')).toBeInTheDocument()
  })

  it('calls action handler when primary action is clicked', () => {
    render(<ErrorPage action={mockActions.action} />)

    fireEvent.click(screen.getByText('Go Home'))
    expect(mockActions.action.onClick).toHaveBeenCalledTimes(1)
  })

  it('calls secondary action handler when secondary action is clicked', () => {
    render(<ErrorPage secondaryAction={mockActions.secondaryAction} />)

    fireEvent.click(screen.getByText('Go Back'))
    expect(mockActions.secondaryAction.onClick).toHaveBeenCalledTimes(1)
  })

  it('renders action icons when provided', () => {
    render(<ErrorPage action={mockActions.action} secondaryAction={mockActions.secondaryAction} />)

    expect(screen.getByTestId('home-icon')).toBeInTheDocument()
    expect(screen.getByTestId('back-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<ErrorPage className="custom-error-page" />)

    const container = screen.getByText('404').closest('.custom-error-page')
    expect(container).toBeInTheDocument()
  })
}) 