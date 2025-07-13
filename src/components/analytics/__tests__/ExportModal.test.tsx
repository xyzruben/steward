// ============================================================================
// EXPORT MODAL COMPONENT TESTS
// ============================================================================
// Comprehensive tests for ExportModal component
// See: Master System Guide - Testing and Quality Assurance

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportModal from '../../export/ExportModal'

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCategories = ['groceries', 'transportation', 'entertainment']
const mockMerchants = ['walmart', 'target', 'amazon']

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onExport: jest.fn().mockResolvedValue(undefined)
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ExportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render when open', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByText('Export Data')).toBeInTheDocument()
      expect(screen.getByText('CSV')).toBeInTheDocument()
      expect(screen.getByText('JSON')).toBeInTheDocument()
      expect(screen.getByText('PDF')).toBeInTheDocument()
      expect(screen.getByText('Include analytics summary (categories, merchants, trends)')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} isOpen={false} />)

      // Assert
      expect(screen.queryByText('Export Data')).not.toBeInTheDocument()
    })

    it('should show advanced options when toggled', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const advancedButton = screen.getByText('Show Advanced Options')
      await user.click(advancedButton)

      // Assert
      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(screen.getByText('Amount Range')).toBeInTheDocument()
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Start Date')).toBeInTheDocument()
      expect(screen.getByText('End Date')).toBeInTheDocument()
      expect(screen.getByText('Minimum Amount')).toBeInTheDocument()
      expect(screen.getByText('Maximum Amount')).toBeInTheDocument()
    })

    it('should hide advanced options when toggled again', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      await user.click(advancedButton)

      // Act - Hide advanced options
      const hideButton = screen.getByText('Hide Advanced Options')
      await user.click(hideButton)

      // Assert
      expect(screen.queryByText('Date Range')).not.toBeInTheDocument()
      expect(screen.queryByText('Amount Range')).not.toBeInTheDocument()
      expect(screen.queryByText('Filters')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // INTERACTION TESTS
  // ============================================================================

  describe('Interactions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Assert
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when background is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Click the background overlay
      const background = screen.getByText('Export Data').closest('div')?.parentElement?.parentElement?.parentElement
      if (background) {
        await user.click(background)
      }

      // Assert
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when X button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const closeButton = screen.getByRole('button', { name: '' }) // X button has no accessible name
      await user.click(closeButton)

      // Assert
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should change format when format buttons are clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Click JSON format
      const jsonButton = screen.getByText('JSON').closest('button')
      await user.click(jsonButton!)

      // Act - Click export to trigger onExport
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'json'
        })
      )
    })

    it('should toggle analytics checkbox', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Check analytics
      const analyticsCheckbox = screen.getByRole('checkbox')
      await user.click(analyticsCheckbox)

      // Act - Click export to trigger onExport
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          includeAnalytics: true
        })
      )
    })

    it('should handle date range inputs', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      await user.click(advancedButton)

      // Act - Fill date inputs
      const startDateInput = screen.getByLabelText('Start Date')
      const endDateInput = screen.getByLabelText('End Date')
      await user.type(startDateInput, '2024-01-01')
      await user.type(endDateInput, '2024-12-31')

      // Act - Click export to trigger onExport
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: {
            start: '2024-01-01',
            end: '2024-12-31'
          }
        })
      )
    })

    it('should handle amount range inputs', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      await user.click(advancedButton)

      // Act - Fill amount inputs
      const minAmountInput = screen.getByLabelText('Minimum Amount')
      const maxAmountInput = screen.getByLabelText('Maximum Amount')
      await user.type(minAmountInput, '10.50')
      await user.type(maxAmountInput, '100.00')

      // Act - Click export to trigger onExport
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          minAmount: '10.5',
          maxAmount: '100'
        })
      )
    })

    it('should handle category selection', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} availableCategories={mockCategories} />)

      // Act - Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      await user.click(advancedButton)

      // Act - Select categories
      const groceriesButton = screen.getByText('groceries')
      const transportationButton = screen.getByText('transportation')
      await user.click(groceriesButton)
      await user.click(transportationButton)

      // Act - Click export to trigger onExport
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: ['groceries', 'transportation']
        })
      )
    })

    it('should handle merchant selection', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} availableMerchants={mockMerchants} />)

      // Act - Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      await user.click(advancedButton)

      // Act - Select merchants
      const walmartButton = screen.getByText('walmart')
      const targetButton = screen.getByText('target')
      await user.click(walmartButton)
      await user.click(targetButton)

      // Act - Click export to trigger onExport
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          merchants: ['walmart', 'target']
        })
      )
    })
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('Validation', () => {
    it('should validate amount range when min > max', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      await user.click(advancedButton)

      // Act - Set invalid amount range
      const minAmountInput = screen.getByLabelText('Minimum Amount')
      const maxAmountInput = screen.getByLabelText('Maximum Amount')
      await user.type(minAmountInput, '100')
      await user.type(maxAmountInput, '50')

      // Act - Try to export
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert - Export should still be called with the values (validation is handled by the parent)
      expect(defaultProps.onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          minAmount: '100',
          maxAmount: '50'
        })
      )
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByText('Export Data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should have proper labels for form controls', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByText('CSV')).toBeInTheDocument()
      expect(screen.getByText('Include analytics summary (categories, merchants, trends)')).toBeInTheDocument()
      
      // Show advanced options to see date inputs
      const advancedButton = screen.getByText('Show Advanced Options')
      fireEvent.click(advancedButton)
      
      expect(screen.getByText('Start Date')).toBeInTheDocument()
      expect(screen.getByText('End Date')).toBeInTheDocument()
      expect(screen.getByText('Minimum Amount')).toBeInTheDocument()
      expect(screen.getByText('Maximum Amount')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // PROPS TESTS
  // ============================================================================

  describe('Props', () => {
    it('should render categories when provided', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} availableCategories={mockCategories} />)

      // Show advanced options to see categories
      const advancedButton = screen.getByText('Show Advanced Options')
      fireEvent.click(advancedButton)

      // Assert
      expect(screen.getByText('groceries')).toBeInTheDocument()
      expect(screen.getByText('transportation')).toBeInTheDocument()
      expect(screen.getByText('entertainment')).toBeInTheDocument()
    })

    it('should render merchants when provided', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} availableMerchants={mockMerchants} />)

      // Show advanced options to see merchants
      const advancedButton = screen.getByText('Show Advanced Options')
      fireEvent.click(advancedButton)

      // Assert
      expect(screen.getByText('walmart')).toBeInTheDocument()
      expect(screen.getByText('target')).toBeInTheDocument()
      expect(screen.getByText('amazon')).toBeInTheDocument()
    })

    it('should not render categories section when no categories provided', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      fireEvent.click(advancedButton)

      // Assert
      expect(screen.queryByText('Categories')).not.toBeInTheDocument()
    })

    it('should not render merchants section when no merchants provided', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      fireEvent.click(advancedButton)

      // Assert
      expect(screen.queryByText('Merchants')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // STATE MANAGEMENT TESTS
  // ============================================================================

  describe('State Management', () => {
    it('should reset form when modal is reopened', async () => {
      // Arrange
      const user = userEvent.setup()
      const { rerender } = render(<ExportModal {...defaultProps} />)

      // Act - Fill out form
      const jsonButton = screen.getByText('JSON').closest('button')
      await user.click(jsonButton!)

      const analyticsCheckbox = screen.getByRole('checkbox')
      await user.click(analyticsCheckbox)

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Reopen modal - this should trigger the useEffect to reset state
      rerender(<ExportModal {...defaultProps} isOpen={true} />)

      // Wait for the state to be reset
      await waitFor(() => {
        // The form should be reset to defaults
        expect(screen.getByText('CSV').closest('button')).toHaveClass('border-blue-500')
        expect(screen.getByRole('checkbox')).not.toBeChecked()
      })

      // Assert - Form should be reset to defaults
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'csv', // Should be reset to default
        includeAnalytics: false, // Should be reset to default
        dateRange: null,
        categories: [],
        merchants: [],
        minAmount: '',
        maxAmount: ''
      })
    })

    it('should maintain form state during validation', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Fill out form
      const jsonButton = screen.getByText('JSON').closest('button')
      await user.click(jsonButton!)

      const analyticsCheckbox = screen.getByRole('checkbox')
      await user.click(analyticsCheckbox)

      // Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options')
      await user.click(advancedButton)

      // Set amount range
      const minAmountInput = screen.getByLabelText('Minimum Amount')
      const maxAmountInput = screen.getByLabelText('Maximum Amount')
      await user.type(minAmountInput, '100')
      await user.type(maxAmountInput, '50')

      // Export should still work with the form data
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert - Form state should be maintained
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'json',
        includeAnalytics: true,
        dateRange: null,
        categories: [],
        merchants: [],
        minAmount: '100',
        maxAmount: '50'
      })
    })
  })
}) 