// ============================================================================
// RECEIPT UPLOAD COMPONENT TESTS - AI-First Architecture
// ============================================================================
// Tests for ReceiptUpload component functionality
// Aligned with AI-First Architecture - no notification dependencies

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReceiptUpload } from '../ReceiptUpload'

// ============================================================================
// TEST SETUP - AI-First Architecture
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
// UNIT TESTS - AI-First Architecture
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
    
    // AI-First Architecture: No notification service dependencies
    // Removed notification service setup as it was eliminated in Phase 0
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS - Core Functionality Only
  // ============================================================================

  describe('Rendering', () => {
    it('should render upload area correctly', () => {
      // Arrange
      render(<ReceiptUpload />)

      // Assert
      // There are multiple elements with 'Upload Receipt', so check count
      expect(screen.getAllByText(/upload receipt/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
      expect(screen.getByText(/or click to browse/i)).toBeInTheDocument()
    })

    it('should show supported file types', () => {
      // Arrange
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByText(/jpeg, png, webp, heic/i)).toBeInTheDocument()
    })

    it('should show file size limit', () => {
      // Arrange
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByText(/max 10mb/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // FILE SELECTION TESTS - Core Functionality Only
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
        expect(screen.getByText(/uploading file/i)).toBeInTheDocument()
      })
    })

    it('should validate file type', async () => {
      // Arrange
      render(<ReceiptUpload />)
      const input = screen.getByLabelText(/upload receipt/i)

      // Assert
      expect(input).toHaveAttribute('accept', 'image/*')
    })

    it('should handle file selection', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      const input = screen.getByLabelText(/upload receipt/i)

      // Act & Assert
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'file')
    })
  })

  // ============================================================================
  // UPLOAD PROCESSING TESTS - Core Functionality Only
  // ============================================================================

  describe('Upload Processing', () => {
    it('should show upload progress', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert - Check for upload progress states
      // The upload might complete quickly, so we check for either uploading or completion
      await waitFor(() => {
        const uploadingText = screen.queryByText(/uploading file/i)
        const processingText = screen.queryByText(/processing image/i)
        const completeText = screen.queryByText(/upload complete!/i)
        
        // At least one of these states should be present
        expect(uploadingText || processingText || completeText).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should show completion state', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert - wait for completion
      await waitFor(() => {
        expect(screen.getByText(/upload complete!/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('should handle upload completion', async () => {
      // Arrange
      const user = userEvent.setup()
      render(<ReceiptUpload />)
      
      const file = new File(['receipt data'], 'receipt.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/upload receipt/i)

      // Act
      await user.upload(input, file)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/upload complete!/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    })
  })

  // ============================================================================
  // USER INTERACTION TESTS - Core Functionality Only
  // ============================================================================

  describe('User Interactions', () => {
    it('should handle drag enter events', () => {
      // Arrange
      render(<ReceiptUpload />)
      const dropZone = screen.getByTestId('upload-dropzone')

      // Act
      fireEvent.dragEnter(dropZone)

      // Assert
      expect(dropZone).toBeInTheDocument()
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

    it('should handle component initialization', () => {
      // Arrange & Act
      render(<ReceiptUpload />)

      // Assert
      // There are multiple elements with 'Upload Receipt', so check that at least one exists
      expect(screen.getAllByText(/upload receipt/i).length).toBeGreaterThan(0)
      expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument()
    })

    it('should render upload interface', () => {
      // Arrange & Act
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument()
      expect(screen.getByLabelText(/upload receipt/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // ACCESSIBILITY TESTS - Core Functionality Only
  // ============================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Arrange & Act
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByLabelText(/upload receipt/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument()
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
      const uploadButton = screen.getByRole('button', { name: /choose file/i })

      // Act & Assert
      expect(uploadButton).toHaveAttribute('tabindex', '0')
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS - Core Functionality Only
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle file input accessibility', () => {
      // Arrange
      render(<ReceiptUpload />)
      const input = screen.getByLabelText(/upload receipt/i)

      // Assert
      expect(input).toHaveAttribute('accept', 'image/*')
      expect(input).toHaveAttribute('type', 'file')
    })

    it('should provide proper form structure', () => {
      // Arrange
      render(<ReceiptUpload />)

      // Assert
      expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/upload receipt/i)).toBeInTheDocument()
    })
  })
}) 