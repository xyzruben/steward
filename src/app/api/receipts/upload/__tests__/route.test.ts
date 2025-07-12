// ============================================================================
// RECEIPT UPLOAD API ROUTE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for the complete receipt upload workflow: auth → validation → OCR → AI → database
// Uses global mocks from jest.setup.js for consistent isolation

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ============================================================================
// TEST SETUP (see master guide: Unit Testing Strategy)
// ============================================================================

// Helper function to create mock files with sufficient size
function createLargeMockFile(name = 'receipt.jpg', type = 'image/jpeg', size = 2048) {
  return new File(['x'.repeat(size)], name, { type })
}

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
}

const mockDbUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockReceipt = {
  id: 'receipt-123',
  userId: 'test-user-id',
  imageUrl: 'https://supabase.co/storage/receipts/test-user-id/123.jpg',
  rawText: 'Welcome to Chick-fil-A\nTotal: $11.48',
  merchant: 'Chick-fil-A',
  total: 11.48,
  purchaseDate: new Date('2025-01-15'),
  summary: 'Purchase at Chick-fil-A for $11.48',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockAiData = {
  merchant: 'Chick-fil-A',
  total: 11.48,
  purchaseDate: '2025-01-15T00:00:00.000Z',
  category: 'Food & Dining',
  tags: ['fast food', 'chicken'],
  confidence: 95,
  summary: 'Purchase at Chick-fil-A for $11.48',
}

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('POST /api/receipts/upload', () => {
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
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-user-id/123.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://supabase.co/storage/receipts/test-user-id/123.jpg' },
        }),
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createReceipt, createUser, getUserById } = require('@/lib/db')
    createReceipt.mockImplementation((params: Record<string, unknown>) => {
      return Promise.resolve({
        id: 'receipt-123',
        userId: params.userId,
        imageUrl: params.imageUrl,
        rawText: params.rawText,
        merchant: params.merchant,
        total: params.total,
        purchaseDate: params.purchaseDate,
        summary: params.summary,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })
    createUser.mockResolvedValue(mockDbUser)
    getUserById.mockResolvedValue(mockDbUser)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { extractTextFromImage, imageBufferToBase64, compressImage } = require('@/lib/services/cloudOcr')
    extractTextFromImage.mockResolvedValue('Welcome to Chick-fil-A\nTotal: $11.48')
    imageBufferToBase64.mockReturnValue('data:image/jpeg;base64,test')
    compressImage.mockImplementation(async (buffer: Buffer) => buffer)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { extractReceiptDataWithAI } = require('@/lib/services/openai')
    extractReceiptDataWithAI.mockResolvedValue(mockAiData)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { cookies } = require('next/headers')
    cookies.mockResolvedValue({})

    // Setup Prisma mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('@/lib/prisma')
    prisma.user.findUnique.mockResolvedValue(mockDbUser)
    prisma.user.create.mockResolvedValue(mockDbUser)
    prisma.receipt.create.mockResolvedValue(mockReceipt)
    prisma.userProfile.findUnique.mockResolvedValue(null)

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
  // SUCCESSFUL UPLOAD TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Successful Uploads', () => {
    it('should process valid receipt upload successfully', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.receipt).toBeDefined()
      expect(data.receipt.merchant).toBe('Chick-fil-A')
      expect(data.receipt.total).toBe(11.48)
    })

    it('should handle different image formats', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.png', 'image/png'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  // ============================================================================
  // AUTHENTICATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
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
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

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

    it('should handle authentication errors', async () => {
      // Arrange
      // Override global mock to simulate auth error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createSupabaseServerClient } = require('@/lib/supabase')
      createSupabaseServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Auth error' },
          }),
        },
      })

      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

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
  })

  // ============================================================================
  // VALIDATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Input Validation', () => {
    it('should reject requests without file', async () => {
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

    it('should reject unsupported file types', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('document.pdf', 'application/pdf'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Unsupported file type')
    })

    it('should reject files that are too large', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('large.jpg', 'image/jpeg', 10 * 1024 * 1024)) // 10MB

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('File too large')
    })
  })

  // ============================================================================
  // PROCESSING TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Processing Pipeline', () => {
    it('should handle OCR processing errors', async () => {
      // Arrange
      // Override global mock to simulate OCR error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { extractTextFromImage } = require('@/lib/services/cloudOcr')
      extractTextFromImage.mockRejectedValue(new Error('OCR failed'))

      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

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
    })

    it('should handle AI processing errors', async () => {
      // Arrange
      // Override global mock to simulate AI error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { extractReceiptDataWithAI } = require('@/lib/services/openai')
      extractReceiptDataWithAI.mockRejectedValue(new Error('AI processing failed'))

      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

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
    })

    it('should handle storage upload errors', async () => {
      // Arrange
      // Override global mock to simulate storage error
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
          upload: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Storage error' },
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://supabase.co/storage/receipts/test-user-id/123.jpg' },
          }),
        },
      })

      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

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
  })

  // ============================================================================
  // DATABASE PERSISTENCE TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Database Persistence', () => {
    it('should create temporary receipt record immediately', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createReceipt } = require('@/lib/db')
      expect(createReceipt).toHaveBeenCalledWith({
        userId: mockUser.id,
        imageUrl: expect.stringContaining('supabase.co/storage'),
        rawText: 'Processing...',
        merchant: 'Processing...',
        total: 0,
        purchaseDate: expect.any(Date),
        summary: 'Processing receipt...',
      })
    })

    it('should handle database creation failures', async () => {
      // Arrange
      // Override global mock to simulate database error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createReceipt } = require('@/lib/db')
      createReceipt.mockRejectedValue(new Error('Database error'))

      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  // ============================================================================
  // NOTIFICATION TESTS (see master guide: Unit Testing Strategy)
  // ============================================================================

  describe('Notifications', () => {
    it('should send notifications on successful upload', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { notificationService } = require('@/lib/services/notifications')
      expect(notificationService.notifyReceiptUploaded).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        'Chick-fil-A'
      )
      expect(notificationService.notifyReceiptProcessed).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        'Chick-fil-A',
        expect.any(Number)
      )
    })

    it('should send error notifications on failure', async () => {
      // Arrange
      // Override global mock to simulate processing error
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { extractTextFromImage } = require('@/lib/services/cloudOcr')
      extractTextFromImage.mockRejectedValue(new Error('OCR failed'))

      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(500)
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { notificationService } = require('@/lib/services/notifications')
      expect(notificationService.notifyReceiptError).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        expect.stringContaining('OCR failed')
      )
    })
  })
}) 