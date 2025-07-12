// ============================================================================
// RECEIPT UPLOAD API ROUTE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for receipt upload endpoint: POST /api/receipts/upload
// Uses global mocks from jest.setup.js for consistent isolation

import { NextRequest } from 'next/server'
import { POST } from '../route'

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
  rawText: 'Sample receipt text',
  confidenceScore: 0.95,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('Receipt Upload API Route', () => {
  beforeEach(() => {
    // Reset all mocks - global mocks are already set up in jest.setup.js
    jest.clearAllMocks()
    
    // Setup default successful responses using global mocks
    // These are already configured in jest.setup.js, but we can override for specific tests
    
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseServerClient } = require('@/lib/supabase')
    createSupabaseServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'receipts/test-receipt.jpg' },
            error: null,
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://example.com/receipt.jpg' },
          }),
        }),
      },
    })
    
    // Setup Prisma mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('@/lib/prisma')
    prisma.user.findUnique.mockResolvedValue(mockUser)
    prisma.receipt.create.mockResolvedValue(mockReceipt)
    
    // Setup service mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { notificationService } = require('@/lib/services/notifications')
    notificationService.notifyReceiptUploaded.mockResolvedValue(undefined)
    notificationService.notifyReceiptProcessed.mockResolvedValue(undefined)
    notificationService.notifyReceiptError.mockResolvedValue(undefined)
    
    // Setup OCR service mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ocrService } = require('@/lib/services/ocr')
    ocrService.extractText.mockResolvedValue({
      text: 'Sample receipt text',
      confidence: 0.95,
    })
    
    // Setup AI service mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { aiService } = require('@/lib/services/ai')
    aiService.categorizeReceipt.mockResolvedValue({
      merchant: 'Walmart',
      total: 25.99,
      category: 'Shopping',
      subcategory: 'Groceries',
      purchaseDate: new Date('2024-01-01'),
      summary: 'Grocery purchase',
      confidence: 0.95,
    })
  })

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  // ============================================================================
  // POST /api/receipts/upload TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('POST /api/receipts/upload', () => {
    it('should upload and process receipt successfully', async () => {
      // Arrange
      const formData = new FormData()
      const file = new File(['receipt image data'], 'receipt.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.receipt.merchant).toBe('Walmart')
      expect(data.receipt.total).toBe(25.99)
      
      // Verify OCR was called
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ocrService } = require('@/lib/services/ocr')
      expect(ocrService.extractText).toHaveBeenCalled()
      
      // Verify AI categorization was called
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { aiService } = require('@/lib/services/ai')
      expect(aiService.categorizeReceipt).toHaveBeenCalled()
      
      // Verify notification was sent
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { notificationService } = require('@/lib/services/notifications')
      expect(notificationService.notifyReceiptUploaded).toHaveBeenCalledWith(mockUser.id)
    })

    it('should handle unauthenticated requests', async () => {
      // Arrange
      // Override global mock to simulate unauthenticated user
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createSupabaseServerClient } = require('@/lib/supabase')
      createSupabaseServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      })

      const formData = new FormData()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should validate file presence', async () => {
      // Arrange
      const formData = new FormData()
      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('should validate file type', async () => {
      // Arrange
      const formData = new FormData()
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only images are allowed.')
    })

    it('should handle file upload errors', async () => {
      // Arrange
      // Override global mock to simulate upload error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createSupabaseServerClient } = require('@/lib/supabase')
      createSupabaseServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        storage: {
          from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Upload failed' },
            }),
          }),
        },
      })

      const formData = new FormData()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload file')
    })

    it('should handle OCR processing errors', async () => {
      // Arrange
      // Override global mock to simulate OCR error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ocrService } = require('@/lib/services/ocr')
      ocrService.extractText.mockRejectedValue(new Error('OCR failed'))

      const formData = new FormData()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process receipt')
      
      // Verify error notification was sent
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { notificationService } = require('@/lib/services/notifications')
      expect(notificationService.notifyReceiptError).toHaveBeenCalledWith(mockUser.id, 'OCR failed')
    })

    it('should handle AI categorization errors', async () => {
      // Arrange
      // Override global mock to simulate AI error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { aiService } = require('@/lib/services/ai')
      aiService.categorizeReceipt.mockRejectedValue(new Error('AI categorization failed'))

      const formData = new FormData()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process receipt')
      
      // Verify error notification was sent
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { notificationService } = require('@/lib/services/notifications')
      expect(notificationService.notifyReceiptError).toHaveBeenCalledWith(mockUser.id, 'AI categorization failed')
    })

    it('should handle database errors', async () => {
      // Arrange
      // Override global mock to simulate database error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require('@/lib/prisma')
      prisma.receipt.create.mockRejectedValue(new Error('Database error'))

      const formData = new FormData()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save receipt')
    })

    it('should handle large file sizes', async () => {
      // Arrange
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', largeFile)

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('File size too large. Maximum size is 5MB.')
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle malformed form data', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: 'invalid form data',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid form data')
    })

    it('should handle missing file field', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('otherField', 'value')

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })
  })
}) 