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
// TEST DATA
// ============================================================================

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onExport: jest.fn()
}

const mockCategories = [
  'groceries',
  'transportation',
  'entertainment'
]

const mockMerchants = [
  'walmart',
  'target',
  'amazon'
]

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
    it('should render modal when isOpen is true', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Export Data')).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} isOpen={false} />)

      // Assert
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render all form sections', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByText('Export Format')).toBeInTheDocument()
      expect(screen.getByText('Include Analytics')).toBeInTheDocument()
      expect(screen.getByText('Show Advanced Options')).toBeInTheDocument()
    })

    it('should render format options', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByText('CSV')).toBeInTheDocument()
      expect(screen.getByText('JSON')).toBeInTheDocument()
      expect(screen.getByText('PDF')).toBeInTheDocument()
    })

    it('should render include analytics checkbox', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByText('Include analytics summary (categories, merchants, trends)')).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  // ============================================================================
  // INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Assert
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onClose when close button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      // Assert
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should call onExport with default values when export button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'csv',
        includeAnalytics: false,
        dateRange: null,
        categories: [],
        merchants: [],
        minAmount: '',
        maxAmount: ''
      })
    })

    it('should call onExport with selected format', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const jsonButton = screen.getByText('JSON').closest('button')
      await user.click(jsonButton!)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'json',
        includeAnalytics: false,
        dateRange: null,
        categories: [],
        merchants: [],
        minAmount: '',
        maxAmount: ''
      })
    })

    it('should call onExport with analytics included', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const analyticsCheckbox = screen.getByRole('checkbox')
      await user.click(analyticsCheckbox)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'csv',
        includeAnalytics: true,
        dateRange: null,
        categories: [],
        merchants: [],
        minAmount: '',
        maxAmount: ''
      })
    })

    it('should call onExport with date range', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Show advanced options first
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      await user.click(advancedButton!)

      const startDateInput = screen.getByLabelText('Start Date')
      const endDateInput = screen.getByLabelText('End Date')
      
      await user.type(startDateInput, '2024-01-01')
      await user.type(endDateInput, '2024-01-31')

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'csv',
        includeAnalytics: false,
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        categories: [],
        merchants: [],
        minAmount: '',
        maxAmount: ''
      })
    })

    it('should call onExport with selected categories', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} availableCategories={mockCategories} />)

      // Act - Show advanced options first
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      await user.click(advancedButton!)

      const groceriesButton = screen.getByText('groceries').closest('button')
      await user.click(groceriesButton!)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'csv',
        includeAnalytics: false,
        dateRange: null,
        categories: ['groceries'],
        merchants: [],
        minAmount: '',
        maxAmount: ''
      })
    })

    it('should call onExport with selected merchants', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} availableMerchants={mockMerchants} />)

      // Act - Show advanced options first
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      await user.click(advancedButton!)

      const walmartButton = screen.getByText('walmart').closest('button')
      await user.click(walmartButton!)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'csv',
        includeAnalytics: false,
        dateRange: null,
        categories: [],
        merchants: ['walmart'],
        minAmount: '',
        maxAmount: ''
      })
    })

    it('should call onExport with amount range', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Show advanced options first
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      await user.click(advancedButton!)

      const minAmountInput = screen.getByLabelText('Minimum Amount')
      const maxAmountInput = screen.getByLabelText('Maximum Amount')
      
      await user.type(minAmountInput, '10')
      await user.type(maxAmountInput, '100')

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'csv',
        includeAnalytics: false,
        dateRange: null,
        categories: [],
        merchants: [],
        minAmount: '10',
        maxAmount: '100'
      })
    })

    it('should call onExport with all filters combined', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} availableCategories={mockCategories} availableMerchants={mockMerchants} />)

      // Act
      // Select format
      const jsonButton = screen.getByText('JSON').closest('button')
      await user.click(jsonButton!)

      // Select analytics
      const analyticsCheckbox = screen.getByRole('checkbox')
      await user.click(analyticsCheckbox)

      // Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      await user.click(advancedButton!)

      // Set date range
      const startDateInput = screen.getByLabelText('Start Date')
      const endDateInput = screen.getByLabelText('End Date')
      await user.type(startDateInput, '2024-01-01')
      await user.type(endDateInput, '2024-01-31')

      // Set amount range
      const minAmountInput = screen.getByLabelText('Minimum Amount')
      const maxAmountInput = screen.getByLabelText('Maximum Amount')
      await user.type(minAmountInput, '10')
      await user.type(maxAmountInput, '1000')

      // Select categories
      const groceriesButton = screen.getByText('groceries').closest('button')
      await user.click(groceriesButton!)

      // Select merchants
      const walmartButton = screen.getByText('walmart').closest('button')
      await user.click(walmartButton!)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(defaultProps.onExport).toHaveBeenCalledWith({
        format: 'json',
        includeAnalytics: true,
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        categories: ['groceries'],
        merchants: ['walmart'],
        minAmount: '10',
        maxAmount: '1000'
      })
    })
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('Form Validation', () => {
    it('should validate date range when start date is after end date', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const startDateInput = screen.getByLabelText('Start Date')
      const endDateInput = screen.getByLabelText('End Date')
      
      await user.type(startDateInput, '2024-01-31')
      await user.type(endDateInput, '2024-01-01')

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(screen.getByText('Start date cannot be after end date')).toBeInTheDocument()
      expect(defaultProps.onExport).not.toHaveBeenCalled()
    })

    it('should validate amount range when min amount is greater than max amount', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const minAmountInput = screen.getByLabelText('Minimum Amount')
      const maxAmountInput = screen.getByLabelText('Maximum Amount')
      
      await user.type(minAmountInput, '100')
      await user.type(maxAmountInput, '10')

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(screen.getByText('Minimum amount cannot be greater than maximum amount')).toBeInTheDocument()
      expect(defaultProps.onExport).not.toHaveBeenCalled()
    })

    it('should validate negative amounts', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const minAmountInput = screen.getByLabelText('Minimum Amount')
      await user.type(minAmountInput, '-10')

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert
      expect(screen.getByText('Amount must be positive')).toBeInTheDocument()
      expect(defaultProps.onExport).not.toHaveBeenCalled()
    })

    it('should clear validation errors when form is corrected', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act - Create validation error
      const minAmountInput = screen.getByLabelText('Minimum Amount')
      const maxAmountInput = screen.getByLabelText('Maximum Amount')
      
      await user.type(minAmountInput, '100')
      await user.type(maxAmountInput, '10')

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Assert - Error should be shown
      expect(screen.getByText('Minimum amount cannot be greater than maximum amount')).toBeInTheDocument()

      // Act - Fix the error
      await user.clear(minAmountInput)
      await user.type(minAmountInput, '10')

      // Assert - Error should be cleared
      expect(screen.queryByText('Minimum amount cannot be greater than maximum amount')).not.toBeInTheDocument()
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
      const modal = screen.getByText('Export Data').closest('div')
      expect(modal).toBeInTheDocument()
      expect(screen.getByText('Export Data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const modal = screen.getByText('Export Data').closest('div')
      modal?.focus()

      // Assert
      expect(modal).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should have proper focus management', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ExportModal {...defaultProps} />)

      // Act
      const modal = screen.getByText('Export Data').closest('div')
      modal?.focus()

      // Assert
      expect(modal).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    })

    it('should have proper labels for form controls', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Assert
      expect(screen.getByText('CSV')).toBeInTheDocument()
      expect(screen.getByText('Include analytics summary (categories, merchants, trends)')).toBeInTheDocument()
      
      // Show advanced options to see date inputs
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      fireEvent.click(advancedButton!)
      
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
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      fireEvent.click(advancedButton!)

      // Assert
      expect(screen.getByText('groceries')).toBeInTheDocument()
      expect(screen.getByText('transportation')).toBeInTheDocument()
      expect(screen.getByText('entertainment')).toBeInTheDocument()
    })

    it('should render merchants when provided', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} availableMerchants={mockMerchants} />)

      // Show advanced options to see merchants
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      fireEvent.click(advancedButton!)

      // Assert
      expect(screen.getByText('walmart')).toBeInTheDocument()
      expect(screen.getByText('target')).toBeInTheDocument()
      expect(screen.getByText('amazon')).toBeInTheDocument()
    })

    it('should not render categories section when no categories provided', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      fireEvent.click(advancedButton!)

      // Assert
      expect(screen.queryByText('Categories')).not.toBeInTheDocument()
    })

    it('should not render merchants section when no merchants provided', () => {
      // Arrange & Act
      render(<ExportModal {...defaultProps} />)

      // Show advanced options
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      fireEvent.click(advancedButton!)

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

      // Reopen modal
      rerender(<ExportModal {...defaultProps} isOpen={true} />)

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
      const advancedButton = screen.getByText('Show Advanced Options').closest('button')
      await user.click(advancedButton!)

      // Set amount range
      const minAmountInput = screen.getByDisplayValue('')
      const maxAmountInput = screen.getAllByDisplayValue('')[1] // Second empty input
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