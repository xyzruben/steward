// ============================================================================
// EMPTY STATE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing Strategy)
// ============================================================================
// Comprehensive tests for empty state functionality
// Follows master guide: Unit Testing Strategy, Component Testing

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { 
  EmptyState, 
  ReceiptsEmptyState, 
  AnalyticsEmptyState, 
  SearchEmptyState, 
  UploadEmptyState 
} from '../EmptyState'

// ============================================================================
// TEST UTILITIES (see master guide: Testing Strategy)
// ============================================================================

// Mock window.open
const mockOpen = jest.fn()
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true
})

// ============================================================================
// EMPTY STATE TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('EmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default props', () => {
    render(<EmptyState />)

    expect(screen.getByText('Nothing to see here')).toBeInTheDocument()
    expect(screen.getByText('This area is empty. Check back later or take an action to get started.')).toBeInTheDocument()
  })

  it('renders with custom title and description', () => {
    render(
      <EmptyState
        title="Custom Title"
        description="Custom description text"
      />
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })

  it('renders custom icon when provided', () => {
    const CustomIcon = () => <div data-testid="custom-icon">🎯</div>
    
    render(<EmptyState icon={<CustomIcon />} />)

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('renders custom illustration when provided', () => {
    const CustomIllustration = () => <div data-testid="custom-illustration">🎨</div>
    
    render(<EmptyState illustration={<CustomIllustration />} />)

    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument()
  })

  it('calls action handler when action button is clicked', () => {
    const mockAction = jest.fn()
    
    render(
      <EmptyState
        actions={[
          {
            label: 'Test Action',
            onClick: mockAction,
            primary: true
          }
        ]}
      />
    )

    fireEvent.click(screen.getByText('Test Action'))
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('renders multiple actions correctly', () => {
    const mockAction1 = jest.fn()
    const mockAction2 = jest.fn()
    
    render(
      <EmptyState
        actions={[
          {
            label: 'Primary Action',
            onClick: mockAction1,
            primary: true
          },
          {
            label: 'Secondary Action',
            onClick: mockAction2,
            variant: 'outline'
          }
        ]}
      />
    )

    expect(screen.getByText('Primary Action')).toBeInTheDocument()
    expect(screen.getByText('Secondary Action')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Primary Action'))
    expect(mockAction1).toHaveBeenCalledTimes(1)
    
    fireEvent.click(screen.getByText('Secondary Action'))
    expect(mockAction2).toHaveBeenCalledTimes(1)
  })

  it('renders action icons when provided', () => {
    const mockAction = jest.fn()
    
    render(
      <EmptyState
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

  it('renders tips when provided and showTips is true', () => {
    render(
      <EmptyState
        tips={[
          'First tip',
          'Second tip',
          'Third tip'
        ]}
        showTips={true}
      />
    )

    expect(screen.getByText('Pro Tips')).toBeInTheDocument()
    expect(screen.getByText('• First tip')).toBeInTheDocument()
    expect(screen.getByText('• Second tip')).toBeInTheDocument()
    expect(screen.getByText('• Third tip')).toBeInTheDocument()
  })

  it('hides tips when showTips is false', () => {
    render(
      <EmptyState
        tips={['Test tip']}
        showTips={false}
      />
    )

    expect(screen.queryByText('Pro Tips')).not.toBeInTheDocument()
    expect(screen.queryByText('• Test tip')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<EmptyState className="custom-empty-state" />)

    const container = screen.getByText('Nothing to see here').closest('.custom-empty-state')
    expect(container).toBeInTheDocument()
  })
})

// ============================================================================
// RECEIPTS EMPTY STATE TESTS (see master guide: Component Testing)
// ============================================================================

describe('ReceiptsEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with receipts variant configuration', () => {
    render(<ReceiptsEmptyState />)

    expect(screen.getByText('No receipts yet')).toBeInTheDocument()
    expect(screen.getByText('Upload your first receipt to start tracking your expenses with AI-powered insights.')).toBeInTheDocument()
  })

  it('renders default actions for receipts', () => {
    render(<ReceiptsEmptyState />)

    expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
    expect(screen.getByText('Learn More')).toBeInTheDocument()
  })

  it('calls learn more action and opens docs', () => {
    render(<ReceiptsEmptyState />)

    fireEvent.click(screen.getByText('Learn More'))
    expect(mockOpen).toHaveBeenCalledWith('/docs', '_blank')
  })

  it('renders receipts-specific tips', () => {
    render(<ReceiptsEmptyState />)

    expect(screen.getByText('• Take clear photos of your receipts for better OCR accuracy')).toBeInTheDocument()
    expect(screen.getByText('• Upload receipts regularly to maintain accurate expense tracking')).toBeInTheDocument()
    expect(screen.getByText('• Use categories to organize your spending patterns')).toBeInTheDocument()
  })

  it('overrides default configuration with custom props', () => {
    render(
      <ReceiptsEmptyState
        title="Custom Receipts Title"
        description="Custom receipts description"
        actions={[
          {
            label: 'Custom Action',
            onClick: jest.fn(),
            primary: true
          }
        ]}
      />
    )

    expect(screen.getByText('Custom Receipts Title')).toBeInTheDocument()
    expect(screen.getByText('Custom receipts description')).toBeInTheDocument()
    expect(screen.getByText('Custom Action')).toBeInTheDocument()
    expect(screen.queryByText('Upload Receipt')).not.toBeInTheDocument()
  })
})

// ============================================================================
// ANALYTICS EMPTY STATE TESTS (see master guide: Component Testing)
// ============================================================================

describe('AnalyticsEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with analytics variant configuration', () => {
    render(<AnalyticsEmptyState />)

    expect(screen.getByText('No analytics data yet')).toBeInTheDocument()
    expect(screen.getByText('Upload some receipts to see detailed spending insights and trends.')).toBeInTheDocument()
  })

  it('renders default actions for analytics', () => {
    render(<AnalyticsEmptyState />)

    expect(screen.getByText('Upload Receipts')).toBeInTheDocument()
    expect(screen.getByText('View Dashboard')).toBeInTheDocument()
  })

  it('renders analytics-specific tips', () => {
    render(<AnalyticsEmptyState />)

    expect(screen.getByText('• Upload at least 5 receipts to see meaningful trends')).toBeInTheDocument()
    expect(screen.getByText('• Categorize your receipts for better insights')).toBeInTheDocument()
    expect(screen.getByText('• Check back regularly to see your spending patterns')).toBeInTheDocument()
  })
})

// ============================================================================
// SEARCH EMPTY STATE TESTS (see master guide: Component Testing)
// ============================================================================

describe('SearchEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with search variant configuration', () => {
    render(<SearchEmptyState />)

    expect(screen.getByText('No search results found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search terms or filters to find what you\'re looking for.')).toBeInTheDocument()
  })

  it('renders default actions for search', () => {
    render(<SearchEmptyState />)

    expect(screen.getByText('Clear Filters')).toBeInTheDocument()
    expect(screen.getByText('Browse All')).toBeInTheDocument()
  })

  it('renders search-specific tips', () => {
    render(<SearchEmptyState />)

    expect(screen.getByText('• Try using different keywords or search terms')).toBeInTheDocument()
    expect(screen.getByText('• Check your date range and filter settings')).toBeInTheDocument()
    expect(screen.getByText('• Make sure your receipts are properly categorized')).toBeInTheDocument()
  })
})

// ============================================================================
// UPLOAD EMPTY STATE TESTS (see master guide: Component Testing)
// ============================================================================

describe('UploadEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with upload variant configuration', () => {
    render(<UploadEmptyState />)

    expect(screen.getByText('Ready to upload?')).toBeInTheDocument()
    expect(screen.getByText('Start by uploading your first receipt to begin tracking your expenses.')).toBeInTheDocument()
  })

  it('renders default actions for upload', () => {
    render(<UploadEmptyState />)

    expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
    expect(screen.getByText('Learn How')).toBeInTheDocument()
  })

  it('calls learn how action and opens upload docs', () => {
    render(<UploadEmptyState />)

    fireEvent.click(screen.getByText('Learn How'))
    expect(mockOpen).toHaveBeenCalledWith('/docs/upload', '_blank')
  })

  it('renders upload-specific tips', () => {
    render(<UploadEmptyState />)

    expect(screen.getByText('• Supported formats: JPEG, PNG, WebP, HEIC')).toBeInTheDocument()
    expect(screen.getByText('• Maximum file size: 10MB per receipt')).toBeInTheDocument()
    expect(screen.getByText('• Ensure good lighting for better OCR accuracy')).toBeInTheDocument()
  })
})

// ============================================================================
// VARIANT CONFIGURATION TESTS (see master guide: Component Testing)
// ============================================================================

describe('EmptyState Variants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders receipts variant correctly', () => {
    render(<EmptyState variant="receipts" />)

    expect(screen.getByText('No receipts yet')).toBeInTheDocument()
    expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
  })

  it('renders analytics variant correctly', () => {
    render(<EmptyState variant="analytics" />)

    expect(screen.getByText('No analytics data yet')).toBeInTheDocument()
    expect(screen.getByText('Upload Receipts')).toBeInTheDocument()
  })

  it('renders search variant correctly', () => {
    render(<EmptyState variant="search" />)

    expect(screen.getByText('No search results found')).toBeInTheDocument()
    expect(screen.getByText('Clear Filters')).toBeInTheDocument()
  })

  it('renders upload variant correctly', () => {
    render(<EmptyState variant="upload" />)

    expect(screen.getByText('Ready to upload?')).toBeInTheDocument()
    expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
  })

  it('renders general variant correctly', () => {
    render(<EmptyState variant="general" />)

    expect(screen.getByText('Nothing to see here')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('renders custom variant with default general configuration', () => {
    render(<EmptyState variant="custom" />)

    expect(screen.getByText('Nothing to see here')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })
}) 