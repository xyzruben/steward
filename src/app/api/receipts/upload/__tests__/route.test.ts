// ============================================================================
// RECEIPT UPLOAD API ROUTE TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for the complete receipt upload workflow: auth → validation → OCR → AI → database

import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock Next.js server modules
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url: string, init?: RequestInit) {
      return new Request(url, init) as unknown as NextRequest
    }
  },
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    }),
  },
}))

// Mock all external dependencies
jest.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  createReceipt: jest.fn(),
  createUser: jest.fn(),
  getUserById: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    receipt: {
      create: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/cloudOcr', () => ({
  extractTextFromImage: jest.fn(),
  imageBufferToBase64: jest.fn(),
  compressImage: jest.fn(),
}))

jest.mock('@/lib/services/openai', () => ({
  extractReceiptDataWithAI: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Fix: Mock notificationService as an instance with all used methods
jest.mock('@/lib/services/notifications', () => ({
  notificationService: {
    notifyReceiptUploaded: jest.fn(),
    notifyReceiptProcessed: jest.fn(),
    notifyReceiptError: jest.fn(),
    getPreferences: jest.fn(),
    createNotification: jest.fn(),
  },
}))

// Fix: Mock userProfileService as a static class with all used methods
jest.mock('@/lib/services/userProfile', () => ({
  userProfileService: {
    getUserProfile: jest.fn(),
  },
}))

// ============================================================================
// MOCK DATA (see master guide: Mocking Practices)
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockCreateReceipt: jest.Mock
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockCreateUser: jest.Mock
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockGetUserById: jest.Mock
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockExtractTextFromImage: jest.Mock
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockImageBufferToBase64: jest.Mock
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockCompressImage: jest.Mock
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockExtractReceiptDataWithAI: jest.Mock
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockCookies: jest.Mock

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup mock functions
    mockCreateReceipt = jest.fn()
    mockCreateUser = jest.fn()
    mockGetUserById = jest.fn()
    mockExtractTextFromImage = jest.fn()
    mockImageBufferToBase64 = jest.fn()
    mockCompressImage = jest.fn()
    mockExtractReceiptDataWithAI = jest.fn()
    mockCookies = jest.fn()

    // Setup Supabase mock
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      },
    }

    // Setup module mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseServerClient } = require('@/lib/supabase')
    createSupabaseServerClient.mockReturnValue(mockSupabase)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createReceipt, createUser, getUserById } = require('@/lib/db')
    createReceipt.mockImplementation((params: Record<string, unknown>) => {
      // Return a receipt based on the parameters passed, not the hardcoded mockReceipt
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
    imageBufferToBase64.mockReturnValue('data:image/jpeg;base64,mock-base64-data')
    compressImage.mockImplementation(async (buffer: Buffer) => buffer) // Return original buffer for testing

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { extractReceiptDataWithAI } = require('@/lib/services/openai')
    extractReceiptDataWithAI.mockResolvedValue(mockAiData)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { cookies } = require('next/headers')
    cookies.mockResolvedValue({})

    // Setup default successful responses
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.storage.upload.mockResolvedValue({
      data: { path: 'test-user-id/123.jpg' },
      error: null,
    })

    mockSupabase.storage.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://supabase.co/storage/receipts/test-user-id/123.jpg' },
    })

    // Setup Prisma mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('@/lib/prisma')
    prisma.user.findUnique.mockResolvedValue(mockDbUser)
    prisma.user.create.mockResolvedValue(mockDbUser)
    prisma.receipt.create.mockResolvedValue(mockReceipt)
    prisma.userProfile.findUnique.mockResolvedValue(null)

    // Setup service mocks (fix: use correct export names)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { notificationService } = require('@/lib/services/notifications')
    notificationService.notifyReceiptUploaded.mockResolvedValue(undefined)
    notificationService.notifyReceiptProcessed.mockResolvedValue(undefined)
    notificationService.notifyReceiptError.mockResolvedValue(undefined)
    notificationService.getPreferences.mockResolvedValue({
      userId: mockUser.id,
      emailNotifications: true,
      pushNotifications: true,
      receiptUploads: true,
      receiptProcessing: true,
      analyticsUpdates: true,
      searchSuggestions: true,
      systemAlerts: true,
      exportNotifications: true,
      backupNotifications: true,
    })
    notificationService.createNotification.mockResolvedValue({})

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { userProfileService } = require('@/lib/services/userProfile')
    userProfileService.getUserProfile.mockResolvedValue(null)
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
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

    it('should create user in database if not exists', async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getUserById, createUser } = require('@/lib/db')
      getUserById.mockResolvedValue(null) // User doesn't exist

      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(createUser).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata.full_name,
        avatarUrl: mockUser.user_metadata.avatar_url,
      })
      expect(response.status).toBe(200)
    })
  })

  describe('File Validation', () => {
    it('should return 400 when no file is provided', async () => {
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

    it('should return 400 for unsupported file types', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.txt', 'text/plain'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Unsupported file format')
      expect(data.details).toContain('Supported formats')
    })

    it('should return 400 for HEIC files', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.heic', 'image/heic'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('HEIC files are not supported')
    })

    it('should return 400 for files larger than 10MB', async () => {
      // Arrange
      const largeFile = createLargeMockFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024)
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
      expect(data.error).toBe('File too large. Maximum size is 10MB.')
    })
  })

  describe('File Upload', () => {
    it('should return 500 when Supabase upload fails', async () => {
      // Arrange
      mockSupabase.storage.upload.mockResolvedValue({
        data: null,
        error: new Error('Upload failed'),
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

    it('should upload file with correct parameters', async () => {
      // Arrange
      const formData = new FormData()
      formData.append('file', createLargeMockFile('receipt.jpg', 'image/jpeg'))

      const request = new NextRequest('http://localhost:3000/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      // Act
      await POST(request)

      // Assert
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/test-user-id\/\d+\.jpg/),
        expect.any(Buffer),
        {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        }
      )
    })
  })

  describe('OCR Processing', () => {
    it('should handle OCR extraction failures gracefully in async processing', async () => {
      // Arrange
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

      // Assert - Upload should succeed immediately with processing status
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.receipt.status).toBe('processing')
      expect(data.receipt.merchant).toBe('Processing...')
    })

    it('should start async processing with correct parameters', async () => {
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

      // Assert - Should return immediately with processing status
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.receipt.status).toBe('processing')
      
      // Verify that compression was called
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { compressImage } = require('@/lib/services/cloudOcr')
      expect(compressImage).toHaveBeenCalledWith(
        expect.any(Buffer),
        'image/jpeg'
      )
    })
  })

  describe('AI Processing', () => {
    it('should handle AI processing failures gracefully in async processing', async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { extractReceiptDataWithAI } = require('@/lib/services/openai')
      // Override the mock to throw an error for this test (after beforeEach has run)
      extractReceiptDataWithAI.mockImplementation(() => {
        throw new Error('AI processing failed')
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

      // Assert - Upload should succeed immediately with processing status
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.receipt.status).toBe('processing')
      expect(data.receipt.merchant).toBe('Processing...')
    })

    it('should return processing status immediately for successful uploads', async () => {
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

      // Assert - Should return immediately with processing status
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.receipt.status).toBe('processing')
      expect(data.receipt.merchant).toBe('Processing...')
      expect(data.receipt.total).toBe(0)
    })
  })

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

  describe('Success Response', () => {
    it('should return successful response with processing status', async () => {
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
      expect(data.receipt).toEqual({
        id: 'receipt-123',
        imageUrl: expect.stringContaining('supabase.co/storage'),
        merchant: 'Processing...',
        total: 0,
        purchaseDate: expect.any(String),
        ocrConfidence: 0,
        category: null,
        tags: [],
        summary: 'Processing receipt...',
        status: 'processing',
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'))

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
}) 