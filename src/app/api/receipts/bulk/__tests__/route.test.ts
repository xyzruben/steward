import { NextRequest } from 'next/server'
import { POST } from '../route'
import { createSupabaseServerClient } from '@/lib/supabase'
import { deleteReceipt, updateReceipt, getReceiptsByUserId } from '@/lib/db'
import { bulkOperationsService } from '@/lib/services/bulkOperations'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('@/lib/db')
jest.mock('@/lib/services/bulkOperations')
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({})
}))

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    receipt: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

const mockCreateSupabaseServerClient = createSupabaseServerClient as jest.MockedFunction<typeof createSupabaseServerClient>
const mockDeleteReceipt = deleteReceipt as jest.MockedFunction<typeof deleteReceipt>
const mockUpdateReceipt = updateReceipt as jest.MockedFunction<typeof updateReceipt>
const mockGetReceiptsByUserId = getReceiptsByUserId as jest.MockedFunction<typeof getReceiptsByUserId>
const mockBulkOperationsService = bulkOperationsService as jest.Mocked<typeof bulkOperationsService>

describe('/api/receipts/bulk', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockSupabase = {
    auth: {
      getUser: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateSupabaseServerClient.mockReturnValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
    
    // Setup Prisma mocks
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { prisma } = require('@/lib/prisma')
    prisma.user.findUnique.mockResolvedValue({ id: 'user-123' })
    prisma.receipt.findMany.mockResolvedValue([])
    prisma.receipt.updateMany.mockResolvedValue({ count: 0 })
    prisma.receipt.deleteMany.mockResolvedValue({ count: 0 })
    prisma.receipt.count.mockResolvedValue(0)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/receipts/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })
  }

  describe('POST', () => {
    it('should return 401 for unauthenticated user', async () => {
      jest.resetModules(); // Clear module cache

      // Set up the mock BEFORE importing the route
      const mockCreateSupabaseServerClient = require('@/lib/supabase').createSupabaseServerClient;
      mockCreateSupabaseServerClient.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized')
          })
        }
      });

      // Import the route after the mock is set
      const { POST } = require('../route');

      const request = createRequest({
        action: 'delete',
        receiptIds: ['receipt-1']
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    })

    it('should return 400 for missing action', async () => {
      const request = createRequest({
        receiptIds: ['receipt-1']
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })

    it('should return 400 for missing receiptIds', async () => {
      const request = createRequest({
        action: 'delete'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('receiptIds array is required')
    })

    it('should return 400 for invalid action', async () => {
      const request = createRequest({
        action: 'invalid',
        receiptIds: ['receipt-1']
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })

    it('should return 400 for update action without updates', async () => {
      const request = createRequest({
        action: 'update',
        receiptIds: ['receipt-1']
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('updates object is required')
    })

    describe('delete action', () => {
      it('should successfully delete receipts', async () => {
        const mockDeleteResult = {
          success: true,
          processedCount: 2,
          successCount: 2,
          errorCount: 0,
          errors: [],
          operationId: 'test-operation-id',
          duration: 100
        }

        mockBulkOperationsService.bulkDelete.mockResolvedValue(mockDeleteResult as any)

        const request = createRequest({
          action: 'delete',
          receiptIds: ['receipt-1', 'receipt-2']
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.processedCount).toBe(2)
        expect(data.successCount).toBe(2)
        expect(data.errorCount).toBe(0)
        expect(data.errors).toHaveLength(0)
      })

      it('should handle partial failures', async () => {
        const mockDeleteResult = {
          success: true,
          processedCount: 2,
          successCount: 1,
          errorCount: 1,
          errors: [{ receiptId: 'receipt-2', error: 'Database error' }],
          operationId: 'test-operation-id',
          duration: 100
        }

        mockBulkOperationsService.bulkDelete.mockResolvedValue(mockDeleteResult as any)

        const request = createRequest({
          action: 'delete',
          receiptIds: ['receipt-1', 'receipt-2']
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.successCount).toBe(1)
        expect(data.errorCount).toBe(1)
        expect(data.errors).toHaveLength(1)
      })
    })

    describe('update action', () => {
      it('should successfully update receipts', async () => {
        const mockUpdateResult = {
          success: true,
          processedCount: 1,
          successCount: 1,
          errorCount: 0,
          errors: [],
          operationId: 'test-operation-id',
          duration: 100
        }

        mockBulkOperationsService.bulkUpdate.mockResolvedValue(mockUpdateResult as any)

        const request = createRequest({
          action: 'update',
          receiptIds: ['receipt-1'],
          updates: {
            category: 'Food & Dining',
            subcategory: 'Restaurants'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.processedCount).toBe(1)
        expect(data.successCount).toBe(1)
        expect(data.errorCount).toBe(0)
      })
    })

    describe('export action', () => {
      it('should successfully export receipts', async () => {
        const mockExportResult = {
          receipts: [
            {
              id: 'receipt-1',
              merchant: 'Test Store',
              total: 10.99,
              purchaseDate: new Date('2024-01-01'),
              category: 'Food & Dining',
              subcategory: 'Restaurants',
              summary: 'Test receipt',
              imageUrl: 'https://example.com/receipt1.jpg'
            }
          ],
          totalCount: 1,
          filteredCount: 1,
          appliedFilters: {}
        }

        mockBulkOperationsService.prepareBulkExport.mockResolvedValue(mockExportResult as any)

        const request = createRequest({
          action: 'export',
          receiptIds: ['receipt-1']
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.receipts).toHaveLength(1)
        expect(data.receipts[0].merchant).toBe('Test Store')
        expect(data.format).toBe('csv')
        expect(data.includeAnalytics).toBe(false)
      })
    })
  })
}) 

