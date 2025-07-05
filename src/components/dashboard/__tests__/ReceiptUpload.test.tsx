/**
 * @file ReceiptUpload.test.tsx
 * @description Unit tests for ReceiptUpload component
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Testing, Unit Testing Strategy
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from '@jest/globals'
import ReceiptUpload from '../ReceiptUpload'

describe('ReceiptUpload', () => {
  const mockOnUploadSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render upload interface correctly', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      // Check main elements are present
      expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
      expect(screen.getByText(/Upload a receipt image/)).toBeInTheDocument()
      expect(screen.getByText(/Supported formats: JPEG, PNG/)).toBeInTheDocument()
      expect(screen.getByText(/Drag and drop your receipt here/)).toBeInTheDocument()
      expect(screen.getByText('Choose File')).toBeInTheDocument()
    })

    it('should show file format guidance', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      expect(screen.getByText(/HEIC files need to be converted/)).toBeInTheDocument()
      expect(screen.getByText(/JPEG, PNG • Max 10MB/)).toBeInTheDocument()
    })

    it('should have proper button states and roles', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const uploadButton = screen.getByText('Choose File')
      expect(uploadButton).toHaveAttribute('type', 'button')
      expect(uploadButton).not.toBeDisabled()
    })
  })

  describe('Component Structure', () => {
    it('should have proper header structure', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const header = screen.getByText('Upload Receipt').closest('h3')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('text-lg', 'font-semibold')
    })

    it('should have proper styling classes', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const container = screen.getByText('Upload Receipt').closest('.bg-white')
      expect(container).toHaveClass('rounded-lg', 'shadow-md', 'border')
    })
  })

  describe('Information Display', () => {
    it('should display file format information', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const infoBox = screen.getByText(/Supported formats: JPEG, PNG/).closest('.bg-blue-50')
      expect(infoBox).toBeInTheDocument()
      expect(infoBox).toHaveClass('border-blue-200', 'rounded-md')
    })

    it('should display file size limits', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      expect(screen.getByText(/Max 10MB/)).toBeInTheDocument()
    })

    it('should display HEIC conversion guidance', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      expect(screen.getByText(/HEIC files need to be converted/)).toBeInTheDocument()
    })
  })

  describe('Upload Area', () => {
    it('should have proper dropzone styling', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const dropzone = screen.getByText(/Drag and drop your receipt here/).closest('.border-dashed')
      expect(dropzone).toHaveClass('border-2', 'rounded-lg', 'cursor-pointer')
    })

    it('should have proper button styling', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const button = screen.getByText('Choose File')
      expect(button).toHaveClass('px-4', 'py-2', 'bg-white', 'border')
    })
  })

  describe('Props and Callbacks', () => {
    it('should accept onUploadSuccess callback prop', () => {
      const testCallback = jest.fn()
      render(<ReceiptUpload onUploadSuccess={testCallback} />)

      // Component should render without errors
      expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
    })

    it('should render with default props', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      // Component should render all expected elements
      expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
      expect(screen.getByText('Choose File')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button accessibility', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const button = screen.getByText('Choose File')
      expect(button).toHaveAttribute('type', 'button')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Styling and Layout', () => {
    it('should have proper container styling', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const container = screen.getByText('Upload Receipt').closest('.bg-white')
      expect(container).toHaveClass('w-full', 'max-w-md', 'rounded-lg', 'shadow-md')
    })

    it('should have proper header styling', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const header = screen.getByText('Upload Receipt').closest('h3')
      expect(header).toHaveClass('text-lg', 'font-semibold', 'text-gray-900')
    })

    it('should have proper content spacing', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      // Find the content area with space-y-4 class
      const content = screen.getByText(/Drag and drop your receipt here/).closest('.space-y-4')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('space-y-4')
    })
  })
}) 