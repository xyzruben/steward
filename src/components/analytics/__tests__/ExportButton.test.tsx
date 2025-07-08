// ============================================================================
// EXPORT BUTTON COMPONENT TESTS
// ============================================================================
// Comprehensive tests for ExportButton component
// See: Master System Guide - Testing and Quality Assurance

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportButton from '@/components/export/ExportButton'
import { useExport } from '@/hooks/useExport'

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Download: () => <div data-testid="download-icon">Download Icon</div>
}))

// Mock the useExport hook
jest.mock('@/hooks/useExport')
const mockUseExport = useExport as jest.MockedFunction<typeof useExport>

// Mock the ExportModal component
jest.mock('@/components/export/ExportModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onExport }: any) => (
    isOpen ? (
      <div data-testid="export-modal">
        <button onClick={() => onExport({ format: 'csv' })}>Export CSV</button>
        <button onClick={() => onExport({ format: 'json' })}>Export JSON</button>
        <button onClick={() => onExport({ format: 'pdf' })}>Export PDF</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}))

// ============================================================================
// TEST SUITE
// ============================================================================

describe('ExportButton', () => {
  const defaultProps = {
    className: 'test-class',
    variant: 'primary' as const,
    size: 'md' as const
  }

  const mockExportData = jest.fn()
  const mockResetState = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseExport.mockReturnValue({
      exportData: mockExportData,
      resetState: mockResetState,
      clearError: jest.fn(),
      isExporting: false,
      error: null,
      lastExport: null
    })
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render export button with correct text', () => {
      render(<ExportButton {...defaultProps} />)
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<ExportButton {...defaultProps} className="test-class" />)
      const button = screen.getByRole('button', { name: /export/i })
      expect(button).toHaveClass('test-class')
    })

    it('should render with Download icon', () => {
      render(<ExportButton {...defaultProps} />)
      expect(screen.getByTestId('download-icon')).toBeInTheDocument()
    })

    it('should render loading state when exporting', () => {
      mockUseExport.mockReturnValue({
        exportData: mockExportData,
        resetState: mockResetState,
        clearError: jest.fn(),
        isExporting: true,
        error: null,
        lastExport: null
      })
      render(<ExportButton {...defaultProps} />)
      const button = screen.getByRole('button', { name: /exporting/i })
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent(/exporting/i)
    })

    it('should render error message when export fails', () => {
      mockUseExport.mockReturnValue({
        exportData: mockExportData,
        resetState: mockResetState,
        clearError: jest.fn(),
        isExporting: false,
        error: 'Export failed',
        lastExport: null
      })
      render(<ExportButton {...defaultProps} />)
      expect(screen.getByText('Export failed')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // INTERACTION TESTS
  // ============================================================================

  describe('User Interactions', () => {
    it('should open export modal when button is clicked', async () => {
      const user = userEvent.setup()
      render(<ExportButton {...defaultProps} />)
      const button = screen.getByRole('button', { name: /export/i })
      await user.click(button)
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
    })
    it('should close export modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<ExportButton {...defaultProps} />)
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      await waitFor(() => {
        expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument()
      })
    })
    it('should call exportData function with CSV format', async () => {
      const user = userEvent.setup()
      render(<ExportButton {...defaultProps} />)
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
      const csvButton = screen.getByRole('button', { name: /export csv/i })
      await user.click(csvButton)
      expect(mockExportData).toHaveBeenCalledWith({ format: 'csv' })
    })

    it('should call exportData function with JSON format', async () => {
      const user = userEvent.setup()
      render(<ExportButton {...defaultProps} />)
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
      const jsonButton = screen.getByRole('button', { name: /export json/i })
      await user.click(jsonButton)
      expect(mockExportData).toHaveBeenCalledWith({ format: 'json' })
    })

    it('should call exportData function with PDF format', async () => {
      const user = userEvent.setup()
      render(<ExportButton {...defaultProps} />)
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
      const pdfButton = screen.getByRole('button', { name: /export pdf/i })
      await user.click(pdfButton)
      expect(mockExportData).toHaveBeenCalledWith({ format: 'pdf' })
    })

    it('should close modal after successful export', async () => {
      const user = userEvent.setup()
      mockExportData.mockResolvedValue(undefined)
      
      render(<ExportButton {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })

      const csvButton = screen.getByRole('button', { name: /export csv/i })
      await user.click(csvButton)

      await waitFor(() => {
        expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument()
      })
    })

    it('should call resetState function when retry button is clicked', async () => {
      mockUseExport.mockReturnValue({
        exportData: mockExportData,
        resetState: mockResetState,
        clearError: jest.fn(),
        isExporting: false,
        error: 'Export failed',
        lastExport: null
      })

      const user = userEvent.setup()
      render(<ExportButton {...defaultProps} />)

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      expect(mockResetState).toHaveBeenCalled()
    })

    it('should open modal when retry button is clicked after error', async () => {
      mockUseExport.mockReturnValue({
        exportData: mockExportData,
        resetState: mockResetState,
        clearError: jest.fn(),
        isExporting: false,
        error: 'Export failed',
        lastExport: null
      })

      const user = userEvent.setup()
      render(<ExportButton {...defaultProps} />)

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('should have type="button" for accessibility', () => {
      render(<ExportButton {...defaultProps} data-testid="export-btn" />)
      const button = screen.getByTestId('export-btn')
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup()
      mockExportData.mockRejectedValue(new Error('Export failed'))
      
      render(<ExportButton {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })

      const csvButton = screen.getByRole('button', { name: /export csv/i })
      await user.click(csvButton)

      await waitFor(() => {
        expect(screen.queryByTestId('export-modal')).not.toBeInTheDocument()
      })
    })

    it('should show error state after failed export', async () => {
      const user = userEvent.setup()
      mockExportData.mockRejectedValue(new Error('Export failed'))
      
      render(<ExportButton {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument()
      })

      const csvButton = screen.getByRole('button', { name: /export csv/i })
      await user.click(csvButton)

      await waitFor(() => {
        expect(screen.getByText('Export failed')).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // PROPS TESTS
  // ============================================================================

  describe('Props', () => {
    it('should pass outline variant classes', () => {
      render(<ExportButton {...defaultProps} variant="outline" />)
      const button = screen.getByRole('button', { name: /export/i })
      expect(button.className).toMatch(/bg-white/)
      expect(button.className).toMatch(/border-gray-300/)
    })
    it('should pass sm size classes', () => {
      render(<ExportButton {...defaultProps} size="sm" />)
      const button = screen.getByRole('button', { name: /export/i })
      expect(button.className).toMatch(/px-3/)
      expect(button.className).toMatch(/py-1.5/)
    })
    it('should forward extra props to button', () => {
      render(<ExportButton {...defaultProps} data-testid="custom-export-button" />)
      expect(screen.getByTestId('custom-export-button')).toBeInTheDocument()
    })
  })
}) 