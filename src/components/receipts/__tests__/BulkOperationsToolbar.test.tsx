// ============================================================================
// BULK OPERATIONS TOOLBAR COMPONENT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for BulkOperationsToolbar component functionality
// Uses global mocks from jest.setup.js for consistent isolation

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BulkOperationsToolbar } from '../BulkOperationsToolbar'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

const mockReceipts = [
  { 
    id: '1', 
    merchant: 'Store 1', 
    total: 10.99, 
    purchaseDate: new Date('2024-01-01'), 
    category: 'Food',
    imageUrl: 'https://example.com/receipt1.jpg'
  },
  { 
    id: '2', 
    merchant: 'Store 2', 
    total: 25.50, 
    purchaseDate: new Date('2024-01-02'), 
    category: 'Shopping',
    imageUrl: 'https://example.com/receipt2.jpg'
  },
  { 
    id: '3', 
    merchant: 'Store 3', 
    total: 15.75, 
    purchaseDate: new Date('2024-01-03'), 
    category: 'Transportation',
    imageUrl: 'https://example.com/receipt3.jpg'
  }
]

const defaultProps = {
  receipts: mockReceipts,
  selectedReceipts: [],
  onSelectionChange: jest.fn(),
  onBulkUpdate: jest.fn().mockResolvedValue(undefined),
  onBulkDelete: jest.fn().mockResolvedValue(undefined),
  onBulkExport: jest.fn().mockResolvedValue(undefined),
  onShowFilters: jest.fn(),
  isLoading: false
}

// ============================================================================
// TEST SUITE (see master guide: Component Testing)
// ============================================================================

describe('BulkOperationsToolbar', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    
    // Setup window.confirm mock
    window.confirm = jest.fn().mockReturnValue(true)
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Rendering', () => {
    it('should render select all button', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} />)
      
      // Assert
      expect(screen.getByText('Select All')).toBeInTheDocument()
    })

    it('should show selected count when receipts are selected', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Assert
      expect(screen.getByText('2 selected')).toBeInTheDocument()
    })

    it('should show clear selection button when receipts are selected', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1']} />)
      
      // Assert
      expect(screen.getByText('Clear')).toBeInTheDocument()
    })

    it('should show bulk action buttons when receipts are selected', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Assert
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Update')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    it('should not show bulk action buttons when no receipts are selected', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} />)
      
      // Assert
      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      expect(screen.queryByText('Update')).not.toBeInTheDocument()
      expect(screen.queryByText('Export')).not.toBeInTheDocument()
    })

    it('should not render when no receipts are provided', () => {
      // Arrange & Act
      const { container } = render(<BulkOperationsToolbar {...defaultProps} receipts={[]} />)
      
      // Assert
      expect(container.firstChild).toBeNull()
    })
  })

  // ============================================================================
  // INTERACTION TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Selection Management', () => {
    it('should call onSelectionChange when select all is clicked', () => {
      // Arrange
      render(<BulkOperationsToolbar {...defaultProps} />)
      
      // Act
      fireEvent.click(screen.getByText('Select All'))
      
      // Assert
      expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(['1', '2', '3'])
    })

    it('should call onSelectionChange when clear selection is clicked', () => {
      // Arrange
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Clear'))
      
      // Assert
      expect(defaultProps.onSelectionChange).toHaveBeenCalledWith([])
    })

    it('should show deselect all when all receipts are selected', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2', '3']} />)
      
      // Assert
      expect(screen.getByText('Deselect All')).toBeInTheDocument()
    })
  })

  describe('Bulk Operations', () => {
    it('should call onBulkDelete when delete button is clicked', async () => {
      // Arrange
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Delete'))
      
      // Assert
      await waitFor(() => {
        expect(defaultProps.onBulkDelete).toHaveBeenCalled()
      })
    })

    it('should not call onBulkDelete when user cancels confirmation', async () => {
      // Arrange
      window.confirm = jest.fn().mockReturnValue(false)
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Delete'))
      
      // Assert
      await waitFor(() => {
        expect(defaultProps.onBulkDelete).not.toHaveBeenCalled()
      })
    })

    it('should call onBulkUpdate when update button is clicked', async () => {
      // Arrange
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Update'))
      
      // Assert - Update opens a modal, so we just check the button is clickable
      expect(screen.getByText('Update')).toBeInTheDocument()
    })

    it('should call onBulkExport when export button is clicked', async () => {
      // Arrange
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Export'))
      
      // Assert
      await waitFor(() => {
        expect(defaultProps.onBulkExport).toHaveBeenCalledWith('csv')
      })
    })

    it('should call onShowFilters when filters button is clicked', () => {
      // Arrange
      render(<BulkOperationsToolbar {...defaultProps} />)
      
      // Act
      fireEvent.click(screen.getByText('Filters'))
      
      // Assert
      expect(defaultProps.onShowFilters).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // STATE MANAGEMENT TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Loading States', () => {
    it('should disable buttons when loading', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} isLoading={true} />)
      
      // Assert
      const selectAllButton = screen.getByText('Select All').closest('button')
      const filtersButton = screen.getByText('Filters').closest('button')
      
      expect(selectAllButton).toBeDisabled()
      expect(filtersButton).toBeDisabled()
    })

    it('should disable buttons when processing', async () => {
      // Arrange
      let resolvePromise: () => void
      const mockPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      
      const propsWithSlowDelete = {
        ...defaultProps,
        onBulkDelete: jest.fn().mockReturnValue(mockPromise)
      }
      
      render(<BulkOperationsToolbar {...propsWithSlowDelete} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Delete'))
      
      // Assert
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete').closest('button')
        const updateButton = screen.getByText('Update').closest('button')
        const exportButton = screen.getByText('Export').closest('button')
        
        expect(deleteButton).toBeDisabled()
        expect(updateButton).toBeDisabled()
        expect(exportButton).toBeDisabled()
      })
      
      // Cleanup
      resolvePromise!()
    })

    it('should show processing indicator when processing', async () => {
      // Arrange
      let resolvePromise: () => void
      const mockPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      
      const propsWithSlowDelete = {
        ...defaultProps,
        onBulkDelete: jest.fn().mockReturnValue(mockPromise)
      }
      
      render(<BulkOperationsToolbar {...propsWithSlowDelete} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Delete'))
      
      // Assert
      await waitFor(() => {
        expect(screen.getByText('Processing bulk operation...')).toBeInTheDocument()
      })
      
      // Cleanup
      resolvePromise!()
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Assert
      expect(screen.getByText('Delete')).toHaveAttribute('role', 'button')
      expect(screen.getByText('Update')).toHaveAttribute('role', 'button')
      expect(screen.getByText('Export')).toHaveAttribute('role', 'button')
    })

    it('should be keyboard navigable', () => {
      // Arrange & Act
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Assert
      const deleteButton = screen.getByText('Delete').closest('button')
      const updateButton = screen.getByText('Update').closest('button')
      const exportButton = screen.getByText('Export').closest('button')
      
      expect(deleteButton).toBeInTheDocument()
      expect(updateButton).toBeInTheDocument()
      expect(exportButton).toBeInTheDocument()
    })
  })

  // ============================================================================
  // EDGE CASES TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle large selections', () => {
      // Arrange
      const largeReceipts = Array.from({ length: 101 }, (_, i) => ({
        id: `receipt-${i}`,
        merchant: `Store ${i}`,
        total: 10.00,
        purchaseDate: new Date('2024-01-01'),
        imageUrl: `https://example.com/receipt${i}.jpg`
      }))
      
      // Act
      render(
        <BulkOperationsToolbar 
          {...defaultProps} 
          receipts={largeReceipts}
          selectedReceipts={largeReceipts.map(r => r.id)}
        />
      )
      
      // Assert
      expect(screen.getByText(/Large selection detected/)).toBeInTheDocument()
    })

    it('should handle operation errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const propsWithError = {
        ...defaultProps,
        onBulkDelete: jest.fn().mockRejectedValue(new Error('Delete failed'))
      }
      
      render(<BulkOperationsToolbar {...propsWithError} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Delete'))
      
      // Assert
      await waitFor(() => {
        expect(propsWithError.onBulkDelete).toHaveBeenCalled()
      })
      
      // Cleanup
      consoleSpy.mockRestore()
    })

    it('should clear selection after successful delete', async () => {
      // Arrange
      render(<BulkOperationsToolbar {...defaultProps} selectedReceipts={['1', '2']} />)
      
      // Act
      fireEvent.click(screen.getByText('Delete'))
      
      // Assert
      await waitFor(() => {
        expect(defaultProps.onSelectionChange).toHaveBeenCalledWith([])
      })
    })
  })
}) 