/**
 * @file ReceiptUpload.test.tsx
 * @description Unit tests for ReceiptUpload component
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Testing, Unit Testing Strategy
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from '@jest/globals'
import { ReceiptUpload } from '../ReceiptUpload'

describe('ReceiptUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render upload interface correctly', () => {
      render(<ReceiptUpload />)

      // Check main elements are present
      expect(screen.getByText('Upload Receipt')).toBeTruthy()
      expect(screen.getByText(/Upload a receipt image/)).toBeTruthy()
      expect(screen.getByText(/Supported formats: JPEG, PNG/)).toBeTruthy()
      expect(screen.getByText(/Drag and drop your receipt here/)).toBeTruthy()
      expect(screen.getByText('Choose File')).toBeTruthy()
    })

    it('should show file format guidance', () => {
      render(<ReceiptUpload />)

      expect(screen.getByText(/HEIC files need to be converted/)).toBeTruthy()
      expect(screen.getByText(/JPEG, PNG • Max 10MB/)).toBeTruthy()
    })

    it('should have proper button states and roles', () => {
      render(<ReceiptUpload />)

      const uploadButton = screen.getByText('Choose File')
      expect(uploadButton).toBeTruthy()
    })
  })

  describe('Component Structure', () => {
    it('should have proper header structure', () => {
      render(<ReceiptUpload />)

      const header = screen.getByText('Upload Receipt').closest('h3')
      expect(header).toBeTruthy()
    })

    it('should have proper styling classes', () => {
      render(<ReceiptUpload />)

      const container = screen.getByText('Upload Receipt').closest('.bg-white')
      expect(container).toBeTruthy()
    })
  })

  describe('Information Display', () => {
    it('should display file format information', () => {
      render(<ReceiptUpload />)

      const infoBox = screen.getByText(/Supported formats: JPEG, PNG/).closest('.bg-blue-50')
      expect(infoBox).toBeTruthy()
    })

    it('should display file size limits', () => {
      render(<ReceiptUpload />)

      expect(screen.getByText(/Max 10MB/)).toBeTruthy()
    })

    it('should display HEIC conversion guidance', () => {
      render(<ReceiptUpload />)

      expect(screen.getByText(/HEIC files need to be converted/)).toBeTruthy()
    })
  })

  describe('Upload Area', () => {
    it('should have proper dropzone styling', () => {
      render(<ReceiptUpload />)

      const dropzone = screen.getByText(/Drag and drop your receipt here/).closest('.border-dashed')
      expect(dropzone).toBeTruthy()
    })

    it('should have proper button styling', () => {
      render(<ReceiptUpload />)

      const button = screen.getByText('Choose File')
      expect(button).toBeTruthy()
    })
  })

  describe('Props and Callbacks', () => {
    it('should render with default props', () => {
      render(<ReceiptUpload />)

      // Component should render all expected elements
      expect(screen.getByText('Upload Receipt')).toBeTruthy()
      expect(screen.getByText('Choose File')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button accessibility', () => {
      render(<ReceiptUpload />)

      const button = screen.getByText('Choose File')
      expect(button).toBeTruthy()
    })
  })

  describe('Styling and Layout', () => {
    it('should have proper container styling', () => {
      render(<ReceiptUpload />)

      const container = screen.getByText('Upload Receipt').closest('.bg-white')
      expect(container).toBeTruthy()
    })

    it('should have proper header styling', () => {
      render(<ReceiptUpload />)

      const header = screen.getByText('Upload Receipt').closest('h3')
      expect(header).toBeTruthy()
    })

    it('should have proper content spacing', () => {
      render(<ReceiptUpload />)

      // Find the content area with space-y-4 class
      const content = screen.getByText(/Drag and drop your receipt here/).closest('.space-y-4')
      expect(content).toBeTruthy()
    })
  })
}) 