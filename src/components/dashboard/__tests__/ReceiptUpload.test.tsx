// ============================================================================
// RECEIPT UPLOAD COMPONENT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for ReceiptUpload component functionality
// Uses global mocks from jest.setup.js for consistent isolation

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReceiptUpload } from '../ReceiptUpload'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
}

const mockReceipt = {
  id: 'receipt-1',
  userId: 'test-user-id',
  merchant: 'Walmart',
  total: 25.99,
  category: 'Shopping',
  imageUrl: 'https://example.com/receipt.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('ReceiptUpload Component', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    
    // Setup default successful responses using global mocks
    // These are already configured in jest.setup.js, but we can override for specific tests
    
    // Setup fetch mock for upload API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        receipt: mockReceipt,
      }),
    })
    
    // Setup service mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { notificationService } = require('@/lib/services/notifications')
    notificationService.notifyReceiptUploaded.mockResolvedValue(undefined)
    notificationService.notifyReceiptProcessed.mockResolvedValue(undefined)
    notificationService.notifyReceiptError.mockResolvedValue(undefined)
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Rendering', () => {
    it('should render upload area correctly', () => {
      // Arrange & Act
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByText(/upload receipt/i)).toBeInTheDocument()
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
      expect(screen.getByText(/or click to browse/i)).toBeInTheDocument()
    })

    it('should show supported file types', () => {
      // Arrange & Act
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByText(/jpg, jpeg, png/i)).toBeInTheDocument()
    })

    it('should show file size limit', () => {
      // Arrange & Act
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByText(/max 5mb/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // FILE SELECTION TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('File Selection', () => {
    it('should handle file selection via click', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert
      await waitFor(() => {
        expect((input as HTMLInputElement).files?.[0]).toBe(file)
      })
    })

    it('should handle drag and drop', async () => {
      // Arrange
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const dropZone = screen.getByTestId('upload-dropzone')

      // Act
      fireEvent.dragEnter(dropZone)
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      })

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })
    })

    it('should validate file type', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const invalidFile = new File(['data'], 'document.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, invalidFile)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument()
      })
    })

    it('should validate file size', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, largeFile)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // UPLOAD PROCESSING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Upload Processing', () => {
    it('should upload file successfully', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/upload successful/i)).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/receipts/upload', expect.any(Object))
    })

    it('should show upload progress', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument()
      })
    })

    it('should handle upload errors', async () => {
      // Arrange
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Upload failed' }),
      })

      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      // Arrange
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // USER INTERACTION TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('User Interactions', () => {
    it('should show drag overlay on drag enter', () => {
      // Arrange
      render(<ReceiptUpload />)
      const dropZone = screen.getByTestId('upload-dropzone')

      // Act
      fireEvent.dragEnter(dropZone)

      // Assert
      expect(screen.getByText(/drop here/i)).toBeInTheDocument()
    })

    it('should hide drag overlay on drag leave', () => {
      // Arrange
      render(<ReceiptUpload />)
      const dropZone = screen.getByTestId('upload-dropzone')

      // Act
      fireEvent.dragEnter(dropZone)
      fireEvent.dragLeave(dropZone)

      // Assert
      expect(screen.queryByText(/drop here/i)).not.toBeInTheDocument()
    })

    it('should reset state after successful upload', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByText(/upload successful/i)).toBeInTheDocument()
      })

      // Assert
      expect((input as HTMLInputElement).files).toHaveLength(0)
    })

    it('should allow multiple uploads', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file1 = new File(['receipt 1'], 'receipt1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['receipt 2'], 'receipt2.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file1)
      await waitFor(() => {
        expect(screen.getByText(/upload successful/i)).toBeInTheDocument()
      })

      await user.upload(input, file2)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Arrange & Act
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByLabelText(/upload receipt/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload receipt/i })).toBeInTheDocument()
    })

    it('should announce upload status to screen readers', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('should be keyboard navigable', () => {
      // Arrange
      render(<ReceiptUpload />)
      const uploadButton = screen.getByRole('button', { name: /upload receipt/i })

      // Act & Assert
      expect(uploadButton).toHaveAttribute('tabindex', '0')
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS (see master guide: Component Testing)
  // ============================================================================

  describe('Error Handling', () => {
    it('should show error for unsupported file types', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const invalidFile = new File(['data'], 'document.txt', { type: 'text/plain' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, invalidFile)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/only images are allowed/i)).toBeInTheDocument()
      })
    })

    it('should show error for files exceeding size limit', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, largeFile)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/file size too large/i)).toBeInTheDocument()
      })
    })

    it('should clear errors on new file selection', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const invalidFile = new File(['data'], 'document.txt', { type: 'text/plain' })
      const validFile = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, invalidFile)
      await waitFor(() => {
        expect(screen.getByText(/only images are allowed/i)).toBeInTheDocument()
      })

      await user.upload(input, validFile)

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/only images are allowed/i)).not.toBeInTheDocument()
      })
    })
  })
}) 