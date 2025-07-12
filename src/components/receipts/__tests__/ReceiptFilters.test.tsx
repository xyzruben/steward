// ============================================================================
// RECEIPT FILTERS COMPONENT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for ReceiptFilters component functionality
// Uses global mocks from jest.setup.js for consistent isolation

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReceiptFilters } from '../ReceiptFilters'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  DollarSign: () => <div data-testid="dollar-icon">DollarSign</div>,
  Tag: () => <div data-testid="tag-icon">Tag</div>,
  Target: () => <div data-testid="target-icon">Target</div>
}))

// ============================================================================
// TEST SUITE (see master guide: Component Testing)
// ============================================================================

describe('ReceiptFilters', () => {
  const mockOnFiltersChange = jest.fn()

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
    it('should render filter toggle button', () => {
      // Arrange & Act
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Assert
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
    })

    it('should expand filters when toggle button is clicked', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      // Assert
      // Should show filter controls
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Amount Range')).toBeInTheDocument()
      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(screen.getByText('Minimum Confidence Score')).toBeInTheDocument()
    })

    it('should show active filter count when filters are applied', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      // Apply a filter
      const categorySelect = screen.getByDisplayValue('All categories')
      fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
      
      // Assert
      // Should show filter count
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should show clear all button when filters are applied', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      // Apply a filter
      const categorySelect = screen.getByDisplayValue('All categories')
      fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
      
      // Assert
      // Should show clear all button
      expect(screen.getByText('Clear all')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // INTERACTION TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Filter Interactions', () => {
    it('should call onFiltersChange when category is selected', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      const categorySelect = screen.getByDisplayValue('All categories')
      fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
      
      // Assert
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        category: 'Food & Dining'
      })
    })

    it('should call onFiltersChange when subcategory is entered', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      const subcategoryInput = screen.getByPlaceholderText('e.g., Restaurants, Gas Stations')
      fireEvent.change(subcategoryInput, { target: { value: 'Restaurants' } })
      
      // Assert
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        subcategory: 'Restaurants'
      })
    })

    it('should call onFiltersChange when amount range is set', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      const minAmountInput = screen.getByPlaceholderText('Min amount')
      const maxAmountInput = screen.getByPlaceholderText('Max amount')
      
      fireEvent.change(minAmountInput, { target: { value: '10' } })
      fireEvent.change(maxAmountInput, { target: { value: '100' } })
      
      // Assert
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        minAmount: 10,
        maxAmount: 100
      })
    })

    it('should call onFiltersChange when date range is set', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      const dateInputs = screen.getAllByDisplayValue('')
      const startDateInput = dateInputs[3] // Fourth input with empty value (date inputs)
      const endDateInput = dateInputs[4] // Fifth input with empty value (date inputs)
      
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } })
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } })
      
      // Assert
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
    })

    it('should call onFiltersChange when confidence score is selected', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      const confidenceSelect = screen.getByDisplayValue('Any confidence')
      fireEvent.change(confidenceSelect, { target: { value: '0.8' } })
      
      // Assert
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        minConfidence: 0.8
      })
    })
  })

  // ============================================================================
  // FILTER MANAGEMENT TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Filter Management', () => {
    it('should clear filters when clear all button is clicked', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      // Apply a filter first
      const categorySelect = screen.getByDisplayValue('All categories')
      fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
      
      // Clear all filters
      const clearAllButton = screen.getByText('Clear all')
      fireEvent.click(clearAllButton)
      
      // Assert
      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })

    it('should show active filter tags when filters are applied', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      // Apply multiple filters
      const categorySelect = screen.getByDisplayValue('All categories')
      fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
      
      const minAmountInput = screen.getByPlaceholderText('Min amount')
      fireEvent.change(minAmountInput, { target: { value: '10' } })
      
      // Assert
      // Should show filter tags
      expect(screen.getByText('category: Food & Dining')).toBeInTheDocument()
      expect(screen.getByText('minAmount: 10')).toBeInTheDocument()
    })

    it('should remove individual filters when X button is clicked on filter tag', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      // Apply a filter
      const categorySelect = screen.getByDisplayValue('All categories')
      fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
      
      // Remove the filter
      const filterTag = screen.getByText('category: Food & Dining')
      const xButton = filterTag.parentElement?.querySelector('[data-testid="x-icon"]')
      fireEvent.click(xButton!)
      
      // Assert
      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels for filter controls', () => {
      // Arrange & Act
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      // Assert
      const categorySelect = screen.getByDisplayValue('All categories')
      expect(categorySelect).toHaveAttribute('aria-label')
    })

    it('should be keyboard navigable', () => {
      // Arrange & Act
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      // Assert
      const categorySelect = screen.getByDisplayValue('All categories')
      expect(categorySelect).toHaveAttribute('tabIndex', '0')
    })
  })

  // ============================================================================
  // EDGE CASES TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle invalid amount inputs gracefully', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      const minAmountInput = screen.getByPlaceholderText('Min amount')
      fireEvent.change(minAmountInput, { target: { value: 'invalid' } })
      
      // Assert
      // Should handle gracefully without crashing
      expect(screen.getByPlaceholderText('Min amount')).toBeInTheDocument()
    })

    it('should handle empty filter values', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      const subcategoryInput = screen.getByPlaceholderText('e.g., Restaurants, Gas Stations')
      fireEvent.change(subcategoryInput, { target: { value: '' } })
      
      // Assert
      // Should handle empty values gracefully
      expect(screen.getByPlaceholderText('e.g., Restaurants, Gas Stations')).toBeInTheDocument()
    })

    it('should handle multiple rapid filter changes', () => {
      // Arrange
      render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
      
      // Act
      const toggleButton = screen.getByText('Filters').closest('button')
      fireEvent.click(toggleButton!)
      
      const categorySelect = screen.getByDisplayValue('All categories')
      
      // Rapid changes
      fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
      fireEvent.change(categorySelect, { target: { value: 'Shopping' } })
      fireEvent.change(categorySelect, { target: { value: 'Transportation' } })
      
      // Assert
      // Should handle rapid changes without errors
      expect(mockOnFiltersChange).toHaveBeenCalled()
    })
  })
}) 