// ============================================================================
// RECEIPT SEARCH COMPONENT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Comprehensive tests for ReceiptSearch component functionality
// Uses global mocks from jest.setup.js for consistent isolation

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReceiptSearch } from '../ReceiptSearch'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  X: () => <div data-testid="x-icon">X</div>
}))

// ============================================================================
// TEST SUITE (see master guide: Component Testing)
// ============================================================================

describe('ReceiptSearch', () => {
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  // ============================================================================
  // RENDERING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Rendering', () => {
    it('should render search input with placeholder', () => {
      // Arrange & Act
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Assert
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      expect(input).toBeInTheDocument()
    })

    it('should render search icon', () => {
      // Arrange & Act
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Assert
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })

    it('should accept custom placeholder', () => {
      // Arrange
      const customPlaceholder = 'Custom search placeholder'
      
      // Act
      render(<ReceiptSearch onSearch={mockOnSearch} placeholder={customPlaceholder} />)
      
      // Assert
      expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      // Arrange & Act
      const { container } = render(
        <ReceiptSearch onSearch={mockOnSearch} className="custom-class" />
      )
      
      // Assert
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  // ============================================================================
  // INTERACTION TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Search Interactions', () => {
    it('should call onSearch with debounced input', async () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      fireEvent.change(input, { target: { value: 'test search' } })
      
      // Fast forward past debounce delay
      jest.advanceTimersByTime(300)
      
      // Assert
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test search')
      })
    })

    it('should debounce multiple rapid input changes', async () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      
      fireEvent.change(input, { target: { value: 'first' } })
      fireEvent.change(input, { target: { value: 'second' } })
      fireEvent.change(input, { target: { value: 'third' } })
      
      // Fast forward past debounce delay
      jest.advanceTimersByTime(300)
      
      // Assert
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledTimes(1)
        expect(mockOnSearch).toHaveBeenCalledWith('third')
      })
    })

    it('should show clear button when input has value', () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      
      // Assert - Initially no clear button
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument()
      
      // Act
      fireEvent.change(input, { target: { value: 'test' } })
      
      // Assert - Should show clear button
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })

    it('should clear input when clear button is clicked', async () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
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
      
      // Assert
      // Input should be cleared
      expect(input).toHaveValue('')
      
      // Should call onSearch with empty string
      jest.advanceTimersByTime(300)
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('')
      })
    })
  })

  // ============================================================================
  // INPUT HANDLING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Input Handling', () => {
    it('should handle empty input correctly', async () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      fireEvent.change(input, { target: { value: '' } })
      
      jest.advanceTimersByTime(300)
      
      // Assert
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('')
      })
    })

    it('should handle whitespace-only input correctly', async () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      fireEvent.change(input, { target: { value: '   ' } })
      
      jest.advanceTimersByTime(300)
      
      // Assert
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('   ')
      })
    })

    it('should handle special characters in search', async () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      fireEvent.change(input, { target: { value: 'test@example.com' } })
      
      jest.advanceTimersByTime(300)
      
      // Assert
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test@example.com')
      })
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      // Arrange & Act
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Assert
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', 'Search receipts')
    })

    it('should have proper focus styles', () => {
      // Arrange & Act
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Assert
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500')
    })

    it('should be keyboard navigable', () => {
      // Arrange & Act
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Assert
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('tabIndex', '0')
    })
  })

  // ============================================================================
  // EDGE CASES TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very long search terms', async () => {
      // Arrange
      const longSearchTerm = 'a'.repeat(1000)
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      fireEvent.change(input, { target: { value: longSearchTerm } })
      
      jest.advanceTimersByTime(300)
      
      // Assert
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith(longSearchTerm)
      })
    })

    it('should handle rapid typing and clearing', async () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      
      // Rapid typing
      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.change(input, { target: { value: 'another' } })
      
      jest.advanceTimersByTime(300)
      
      // Assert
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('another')
      })
    })

    it('should handle search with numbers and symbols', async () => {
      // Arrange
      render(<ReceiptSearch onSearch={mockOnSearch} />)
      
      // Act
      const input = screen.getByPlaceholderText('Search receipts by merchant, category, or description...')
      fireEvent.change(input, { target: { value: 'Receipt #123 - $50.99' } })
      
      jest.advanceTimersByTime(300)
      
      // Assert
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('Receipt #123 - $50.99')
      })
    })
  })
}) 