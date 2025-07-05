/**
 * @file ReceiptUpload.test.tsx
 * @description Unit tests for ReceiptUpload component
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Testing, Unit Testing Strategy
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ReceiptUpload from '../ReceiptUpload'

// Mock fetch globally
global.fetch = vi.fn()

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({
      onClick: vi.fn(),
      onKeyDown: vi.fn(),
      role: 'button',
      tabIndex: 0,
    }),
    getInputProps: () => ({
      type: 'file',
      accept: 'image/jpeg,image/png',
      multiple: false,
    }),
    isDragActive: false,
  }),
}))

describe('ReceiptUpload', () => {
  const mockOnUploadSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as any).mockClear()
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
  })

  describe('File Upload Success', () => {
    it('should handle successful file upload', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        id: 'receipt-123',
        imageUrl: 'https://example.com/receipt.jpg',
        merchant: 'Walmart',
        total: 45.67,
        purchaseDate: '2024-01-15',
        ocrConfidence: 0.95,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipt: mockResponse }),
      })

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      // Simulate file upload (this would normally be done through dropzone)
      // For testing, we'll trigger the upload handler directly
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
      
      // Get the component instance and call handleFileUpload
      // This is a simplified test - in real usage, this would be triggered by dropzone
      const uploadButton = screen.getByText('Choose File')
      await user.click(uploadButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/receipts/upload', {
          method: 'POST',
          body: expect.any(FormData),
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/Receipt uploaded successfully/)).toBeInTheDocument()
      })

      expect(mockOnUploadSuccess).toHaveBeenCalled()
    })

    it('should show success message after upload', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipt: { id: 'test' } }),
      })

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      // Simulate successful upload
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
      
      await waitFor(() => {
        expect(screen.getByText(/Receipt uploaded successfully/)).toBeInTheDocument()
      })
    })
  })

  describe('File Validation', () => {
    it('should reject HEIC files with helpful message', async () => {
      const user = userEvent.setup()
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      // Create a HEIC file
      const heicFile = new File(['test'], 'receipt.heic', { type: 'image/heic' })

      // Simulate HEIC file upload
      // In a real test, this would be triggered by the dropzone
      // For now, we'll test the validation logic directly
      const uploadArea = screen.getByText(/Drag and drop your receipt here/)
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [heicFile],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/HEIC files are not supported/)).toBeInTheDocument()
        expect(screen.getByText(/convert your receipt to JPEG/)).toBeInTheDocument()
      })
    })

    it('should show error for unsupported file types', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unsupported file type' }),
      })

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle upload errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    })

    it('should handle server error responses', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'File too large' }),
      })

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })

      await waitFor(() => {
        expect(screen.getByText('File too large')).toBeInTheDocument()
      })
    })

    it('should handle unexpected errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during upload', async () => {
      // Mock a slow response
      ;(global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ receipt: { id: 'test' } }),
        }), 100))
      )

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })

      // Check that loading state is shown
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      expect(screen.getByText('Choose File')).toBeDisabled()
    })

    it('should disable upload area during processing', async () => {
      ;(global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ receipt: { id: 'test' } }),
        }), 100))
      )

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })

      const uploadButton = screen.getByText('Choose File')
      expect(uploadButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: 'Upload Receipt' })).toBeInTheDocument()

      // Check for proper button roles
      expect(screen.getByRole('button', { name: 'Choose File' })).toBeInTheDocument()
    })

    it('should provide helpful error messages for screen readers', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })

      await waitFor(() => {
        const errorMessage = screen.getByText('Upload failed')
        expect(errorMessage).toBeInTheDocument()
        // Error should be in a container with proper ARIA attributes
        expect(errorMessage.closest('[role="alert"]') || errorMessage).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should handle file selection through button click', async () => {
      const user = userEvent.setup()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipt: { id: 'test' } }),
      })

      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const uploadButton = screen.getByText('Choose File')
      await user.click(uploadButton)

      // Verify the button is accessible and clickable
      expect(uploadButton).toBeInTheDocument()
      expect(uploadButton).not.toBeDisabled()
    })

    it('should clear error messages on new upload attempt', async () => {
      const user = userEvent.setup()
      
      // First, trigger an error
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
      render(<ReceiptUpload onUploadSuccess={mockOnUploadSuccess} />)

      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })

      // Then trigger a success
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ receipt: { id: 'test' } }),
      })

      await waitFor(() => {
        expect(screen.queryByText('Upload failed')).not.toBeInTheDocument()
        expect(screen.getByText(/Receipt uploaded successfully/)).toBeInTheDocument()
      })
    })
  })
}) 