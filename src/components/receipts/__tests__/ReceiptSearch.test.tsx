import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReceiptSearch } from '../ReceiptSearch'

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  X: () => <div data-testid="x-icon">X</div>
}))

describe('ReceiptSearch', () => {
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render search input with placeholder', () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
    expect(input).toBeInTheDocument()
  })

  it('should render search icon', () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('should call onSearch with debounced input', async () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
    
    fireEvent.change(input, { target: { value: 'test search' } })
    
    // Fast forward past debounce delay
    jest.advanceTimersByTime(300)
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test search')
    })
  })

  it('should debounce multiple rapid input changes', async () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
    
    fireEvent.change(input, { target: { value: 'first' } })
    fireEvent.change(input, { target: { value: 'second' } })
    fireEvent.change(input, { target: { value: 'third' } })
    
    // Fast forward past debounce delay
    jest.advanceTimersByTime(300)
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
      expect(mockOnSearch).toHaveBeenCalledWith('third')
    })
  })

  it('should show clear button when input has value', () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
    
    // Initially no clear button
    expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument()
    
    fireEvent.change(input, { target: { value: 'test' } })
    
    // Should show clear button
    expect(screen.getByTestId('x-icon')).toBeInTheDocument()
  })

  it('should clear input when clear button is clicked', async () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
    
    fireEvent.change(input, { target: { value: 'test' } })
    
    // Fast forward to trigger initial search
    jest.advanceTimersByTime(300)
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('test')
    })
    
    // Clear the search
    const clearButton = screen.getByTestId('x-icon').parentElement
    fireEvent.click(clearButton!)
    
    // Input should be cleared
    expect(input).toHaveValue('')
    
    // Should call onSearch with empty string
    jest.advanceTimersByTime(300)
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })
  })

  it('should accept custom placeholder', () => {
    const customPlaceholder = 'Custom search placeholder'
    render(<ReceiptSearch onSearch={mockOnSearch} placeholder={customPlaceholder} />)
    
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument()
  })

  it('should accept custom className', () => {
    const { container } = render(
      <ReceiptSearch onSearch={mockOnSearch} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should handle empty input correctly', async () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
    
    fireEvent.change(input, { target: { value: '' } })
    
    jest.advanceTimersByTime(300)
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('')
    })
  })

  it('should handle whitespace-only input correctly', async () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
    
    fireEvent.change(input, { target: { value: '   ' } })
    
    jest.advanceTimersByTime(300)
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('   ')
    })
  })

  it('should have proper accessibility attributes', () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Search receipts')
  })

  it('should have proper focus styles', () => {
    render(<ReceiptSearch onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500')
  })
}) 