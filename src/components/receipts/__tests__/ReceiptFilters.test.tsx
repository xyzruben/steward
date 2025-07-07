import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReceiptFilters } from '../ReceiptFilters'

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  DollarSign: () => <div data-testid="dollar-icon">DollarSign</div>,
  Tag: () => <div data-testid="tag-icon">Tag</div>,
  Target: () => <div data-testid="target-icon">Target</div>
}))

describe('ReceiptFilters', () => {
  const mockOnFiltersChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render filter toggle button', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument()
  })

  it('should expand filters when toggle button is clicked', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    // Should show filter controls
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Amount Range')).toBeInTheDocument()
    expect(screen.getByText('Date Range')).toBeInTheDocument()
    expect(screen.getByText('Minimum Confidence Score')).toBeInTheDocument()
  })

  it('should show active filter count when filters are applied', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    // Apply a filter
    const categorySelect = screen.getByDisplayValue('All categories')
    fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
    
    // Should show filter count
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should show clear all button when filters are applied', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    // Apply a filter
    const categorySelect = screen.getByDisplayValue('All categories')
    fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
    
    // Should show clear all button
    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('should call onFiltersChange when category is selected', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    const categorySelect = screen.getByDisplayValue('All categories')
    fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      category: 'Food & Dining'
    })
  })

  it('should call onFiltersChange when subcategory is entered', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    const subcategoryInput = screen.getByPlaceholderText('e.g., Restaurants, Gas Stations')
    fireEvent.change(subcategoryInput, { target: { value: 'Restaurants' } })
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      subcategory: 'Restaurants'
    })
  })

  it('should call onFiltersChange when amount range is set', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    const minAmountInput = screen.getByPlaceholderText('Min amount')
    const maxAmountInput = screen.getByPlaceholderText('Max amount')
    
    fireEvent.change(minAmountInput, { target: { value: '10' } })
    fireEvent.change(maxAmountInput, { target: { value: '100' } })
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      minAmount: 10,
      maxAmount: 100
    })
  })

  it('should call onFiltersChange when date range is set', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    const dateInputs = screen.getAllByDisplayValue('')
    const startDateInput = dateInputs[3] // Fourth input with empty value (date inputs)
    const endDateInput = dateInputs[4] // Fifth input with empty value (date inputs)
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } })
    fireEvent.change(endDateInput, { target: { value: '2024-12-31' } })
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    })
  })

  it('should call onFiltersChange when confidence score is selected', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    const confidenceSelect = screen.getByDisplayValue('Any confidence')
    fireEvent.change(confidenceSelect, { target: { value: '0.8' } })
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      minConfidence: 0.8
    })
  })

  it('should clear filters when clear all button is clicked', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    // Apply a filter first
    const categorySelect = screen.getByDisplayValue('All categories')
    fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
    
    // Clear all filters
    const clearAllButton = screen.getByText('Clear all')
    fireEvent.click(clearAllButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({})
  })

  it('should show active filter tags when filters are applied', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    // Apply multiple filters
    const categorySelect = screen.getByDisplayValue('All categories')
    fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
    
    const minAmountInput = screen.getByPlaceholderText('Min amount')
    fireEvent.change(minAmountInput, { target: { value: '10' } })
    
    // Should show filter tags
    expect(screen.getByText('category: Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('minAmount: 10')).toBeInTheDocument()
  })

  it('should remove individual filters when X button is clicked on filter tag', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    // Apply a filter
    const categorySelect = screen.getByDisplayValue('All categories')
    fireEvent.change(categorySelect, { target: { value: 'Food & Dining' } })
    
    // Remove the filter
    const filterTag = screen.getByText('category: Food & Dining')
    const xButton = filterTag.parentElement?.querySelector('[data-testid="x-icon"]')
    fireEvent.click(xButton!)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({})
  })

  it('should render all category options', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    const categorySelect = screen.getByDisplayValue('All categories')
    
    expect(categorySelect).toHaveValue('')
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('Transportation')).toBeInTheDocument()
    expect(screen.getByText('Shopping')).toBeInTheDocument()
    expect(screen.getByText('Entertainment')).toBeInTheDocument()
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
    expect(screen.getByText('Utilities')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('should render all confidence score options', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    const confidenceSelect = screen.getByDisplayValue('Any confidence')
    
    expect(confidenceSelect).toHaveValue('')
    expect(screen.getByText('50% or higher')).toBeInTheDocument()
    expect(screen.getByText('70% or higher')).toBeInTheDocument()
    expect(screen.getByText('80% or higher')).toBeInTheDocument()
    expect(screen.getByText('90% or higher')).toBeInTheDocument()
  })

  it('should accept custom className', () => {
    const { container } = render(
      <ReceiptFilters onFiltersChange={mockOnFiltersChange} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should handle empty values correctly', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton!)
    
    const subcategoryInput = screen.getByPlaceholderText('e.g., Restaurants, Gas Stations')
    fireEvent.change(subcategoryInput, { target: { value: 'test' } })
    fireEvent.change(subcategoryInput, { target: { value: '' } })
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({})
  })

  it('should have proper accessibility attributes', () => {
    render(<ReceiptFilters onFiltersChange={mockOnFiltersChange} />)
    
    const toggleButton = screen.getByText('Filters').closest('button')
    expect(toggleButton).toBeInTheDocument()
    
    // Check that form controls have proper labels
    const toggleButton2 = screen.getByText('Filters').closest('button')
    fireEvent.click(toggleButton2!)
    
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Amount Range')).toBeInTheDocument()
    expect(screen.getByText('Date Range')).toBeInTheDocument()
    expect(screen.getByText('Minimum Confidence Score')).toBeInTheDocument()
  })
}) 