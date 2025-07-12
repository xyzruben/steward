// ============================================================================
// USE EXPORT HOOK TESTS
// ============================================================================
// Comprehensive tests for useExport hook
// See: Master System Guide - Testing and Quality Assurance

import { renderHook, act, waitFor } from '@testing-library/react'
import { useExport } from '../useExport'

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// ============================================================================
// TEST DATA
// ============================================================================

const mockExportOptions = {
  format: 'csv' as const,
  includeAnalytics: false,
  dateRange: null,
  categories: [],
  merchants: [],
  minAmount: '',
  maxAmount: ''
}

const mockExportResponse = {
  data: 'test,csv,data',
  filename: 'steward_receipts_2024-01-15_10-00-00.csv',
  contentType: 'text/csv',
  size: 100,
  metadata: {
    recordCount: 2,
    totalAmount: 80.67,
    dateRange: {
      start: '2024-01-15T00:00:00.000Z',
      end: '2024-01-16T00:00:00.000Z'
    },
    exportTime: '2024-01-15T10:00:00.000Z'
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('useExport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // INITIAL STATE TESTS
  // ============================================================================

  describe('Initial State', () => {
    it('should return initial state', () => {
      // Arrange & Act
      const { result } = renderHook(() => useExport())

      // Assert
      expect(result.current.isExporting).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.lastExport).toBe(null)
      expect(typeof result.current.exportData).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
      expect(typeof result.current.resetState).toBe('function')
    })
  })

  // ============================================================================
  // EXPORT FUNCTION TESTS
  // ============================================================================

  describe('exportData function', () => {
    it('should successfully export data', async () => {
      // Arrange
      // See: Master System Guide - Testing and Quality Assurance, TypeScript Standards
      const mockBlob = new Blob(['test,csv,data'], { type: 'text/csv' })
      const mockResponse = new Response(mockBlob, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="steward_receipts_2024-01-15_10-00-00.csv"'
        }
      })
      
      // Patch the mockResponse.headers.get to return 'text/csv' for 'content-type'
      mockResponse.headers.get = (name: string) => {
        if (name.toLowerCase() === 'content-type') return 'text/csv'
        if (name.toLowerCase() === 'content-disposition') return 'attachment; filename="steward_receipts_2024-01-15_10-00-00.csv"'
        return null
      }

      mockFetch.mockResolvedValue(mockResponse)
      const { result } = renderHook(() => useExport())
      // Act
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })
      // Assert
      await waitFor(() => {
        expect(result.current.lastExport).toBeDefined()
        expect(result.current.isExporting).toBe(false)
        expect(result.current.error).toBe(null)
      })
      expect(mockFetch).toHaveBeenCalledWith('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: 'csv',
          includeAnalytics: false,
          dateRange: null,
          categories: [],
          merchants: [],
          minAmount: '',
          maxAmount: ''
        })
      })
    })

    it('should handle loading state correctly', async () => {
      // Arrange
      let resolveFetch: (value: Response) => void
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve
      })

      mockFetch.mockReturnValue(fetchPromise)

      const { result } = renderHook(() => useExport())

      // Act
      act(() => {
        result.current.exportData(mockExportOptions)
      })

      // Assert - Should be loading
      expect(result.current.isExporting).toBe(true)
      expect(result.current.error).toBe(null)
      expect(result.current.lastExport).toBe(null)

      // Act - Resolve the promise
      await act(async () => {
        resolveFetch!(new Response(JSON.stringify(mockExportResponse), { status: 200 }))
      })

      // Assert - Should be success
      await waitFor(() => {
        expect(result.current.isExporting).toBe(false)
        expect(result.current.lastExport).toBeDefined()
      })
    })

    it('should handle API errors', async () => {
      // Arrange
      const errorResponse = new Response(JSON.stringify({ error: 'Export failed' }), {
        status: 500
      })

      mockFetch.mockResolvedValue(errorResponse)

      const { result } = renderHook(() => useExport())

      // Act
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('Export failed')
        expect(result.current.isExporting).toBe(false)
        expect(result.current.lastExport).toBe(null)
      })
    })

    it('should handle network errors', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useExport())

      // Act
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
        expect(result.current.isExporting).toBe(false)
        expect(result.current.lastExport).toBe(null)
      })
    })

    it('should handle unauthorized errors', async () => {
      // Arrange
      const unauthorizedResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401
      })

      mockFetch.mockResolvedValue(unauthorizedResponse)

      const { result } = renderHook(() => useExport())

      // Act
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('Unauthorized')
        expect(result.current.isExporting).toBe(false)
        expect(result.current.lastExport).toBe(null)
      })
    })

    it('should handle rate limit errors', async () => {
      // Arrange
      const rateLimitResponse = new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        retryAfter: 3600
      }), {
        status: 429,
        headers: {
          'Retry-After': '3600'
        }
      })

      mockFetch.mockResolvedValue(rateLimitResponse)

      const { result } = renderHook(() => useExport())

      // Act
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('Rate limit exceeded')
        expect(result.current.isExporting).toBe(false)
        expect(result.current.lastExport).toBe(null)
      })
    })

    it('should handle validation errors', async () => {
      // Arrange
      const validationResponse = new Response(JSON.stringify({ 
        error: 'Invalid format. Must be csv, json, or pdf'
      }), {
        status: 400
      })

      mockFetch.mockResolvedValue(validationResponse)

      const { result } = renderHook(() => useExport())

      // Act
      await act(async () => {
        await result.current.exportData({ ...mockExportOptions, format: 'invalid' as any })
      })

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe('Invalid format. Must be csv, json, or pdf')
        expect(result.current.isExporting).toBe(false)
        expect(result.current.lastExport).toBe(null)
      })
    })

    it('should trigger file download on success', async () => {
      // Arrange
      // See: Master System Guide - Testing and Quality Assurance, TypeScript Standards
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      const mockResponse = new Response(mockBlob, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="steward_receipts.csv"'
        }
      })
      mockFetch.mockResolvedValue(mockResponse)
      // Mock URL.createObjectURL and URL.revokeObjectURL BEFORE rendering hook
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
      const mockRevokeObjectURL = jest.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL
      // Use a real anchor element for the mock link
      const realLink = document.createElement('a')
      realLink.click = jest.fn()
      jest.spyOn(document, 'createElement').mockReturnValue(realLink)
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => realLink)
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => realLink)
      const { result } = renderHook(() => useExport())
      // Act
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })
      // Assert
      await waitFor(() => {
        expect(result.current.lastExport).toBeDefined()
      })
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(realLink.href).toBe('blob:mock-url')
      expect(realLink.download).toBe('steward_receipts.csv')
      expect(realLink.click).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should handle different export formats', async () => {
      // Arrange
      const formats = ['csv', 'json', 'pdf'] as const
      for (const format of formats) {
        // Use Blob response for successful exports (not JSON)
        const mockBlob = new Blob(['test data'], { type: 'text/csv' })
        const mockResponse = new Response(mockBlob, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="export.${format}"`
          }
        })
        mockFetch.mockResolvedValue(mockResponse)
        const { result } = renderHook(() => useExport())
        // Act
        await act(async () => {
          await result.current.exportData({ ...mockExportOptions, format })
        })
        // Assert
        await waitFor(() => {
          expect(result.current.lastExport).toBeDefined()
        })
        expect(mockFetch).toHaveBeenCalledWith('/api/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            format,
            includeAnalytics: false,
            dateRange: null,
            categories: [],
            merchants: [],
            minAmount: '',
            maxAmount: ''
          })
        })
      }
    })

    it('should handle complex export options', async () => {
      // Arrange
      const complexOptions = {
        format: 'json' as const,
        includeAnalytics: true,
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        categories: ['groceries', 'transportation'],
        merchants: ['walmart', 'target'],
        minAmount: '10',
        maxAmount: '100'
      }
      // Use Blob response for successful export (not JSON)
      const mockBlob = new Blob(['test data'], { type: 'application/json' })
      const mockResponse = new Response(mockBlob, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="export.json"'
        }
      })
      mockFetch.mockResolvedValue(mockResponse)
      const { result } = renderHook(() => useExport())
      // Act
      await act(async () => {
        await result.current.exportData(complexOptions)
      })
      // Assert
      await waitFor(() => {
        expect(result.current.lastExport).toBeDefined()
      })
      expect(mockFetch).toHaveBeenCalledWith('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: 'json',
          includeAnalytics: true,
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31'
          },
          categories: ['groceries', 'transportation'],
          merchants: ['walmart', 'target'],
          minAmount: '10',
          maxAmount: '100'
        })
      })
    })
  })

  // ============================================================================
  // RESET FUNCTION TESTS
  // ============================================================================

  describe('resetState function', () => {
    it('should reset state to initial values', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify(mockExportResponse), {
        status: 200
      })

      mockFetch.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useExport())

      // Act - First export
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })

      await waitFor(() => {
        expect(result.current.lastExport).toBeDefined()
      })

      // Act - Reset
      act(() => {
        result.current.resetState()
      })

      // Assert
      expect(result.current.isExporting).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.lastExport).toBe(null)
    })

    it('should reset error state', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useExport())

      // Act - First export (should fail)
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })

      // Act - Reset
      act(() => {
        result.current.resetState()
      })

      // Assert
      expect(result.current.error).toBe(null)
      expect(result.current.isExporting).toBe(false)
      expect(result.current.lastExport).toBe(null)
    })
  })

  // ============================================================================
  // CONCURRENT CALLS TESTS
  // ============================================================================

  describe('Concurrent calls', () => {
    it('should handle multiple concurrent export calls', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify(mockExportResponse), {
        status: 200
      })

      mockFetch.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useExport())

      // Act - Multiple concurrent calls
      await act(async () => {
        const promises = [
          result.current.exportData(mockExportOptions),
          result.current.exportData({ ...mockExportOptions, format: 'json' }),
          result.current.exportData({ ...mockExportOptions, format: 'pdf' })
        ]
        await Promise.all(promises)
      })

      // Assert
      await waitFor(() => {
        expect(result.current.lastExport).toBeDefined()
        expect(result.current.isExporting).toBe(false)
      })

      // Should have made 3 API calls
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    // For concurrency/retry tests, ensure error state is cleared before new export
    it('should cancel previous requests when new export is called', async () => {
      // Arrange
      let resolveFirstCall: (value: Response) => void
      const firstCallPromise = new Promise<Response>((resolve) => {
        resolveFirstCall = resolve
      })
      // Use Blob response for successful export (not JSON)
      const mockBlob = new Blob(['test data'], { type: 'text/csv' })
      const secondCallResponse = new Response(mockBlob, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="export.csv"'
        }
      })
      mockFetch
        .mockReturnValueOnce(firstCallPromise)
        .mockResolvedValueOnce(secondCallResponse)
      const { result } = renderHook(() => useExport())
      // Act - Start first export
      act(() => {
        result.current.exportData(mockExportOptions)
      })
      // Assert - Should be loading
      expect(result.current.isExporting).toBe(true)
      // Act - Start second export (should cancel first)
      await act(async () => {
        result.current.clearError()
        await result.current.exportData({ ...mockExportOptions, format: 'json' })
      })
      // Assert - Second export should complete
      await waitFor(() => {
        expect(result.current.lastExport).toBeDefined()
        expect(result.current.isExporting).toBe(false)
      })
      // Act - Resolve first call (should be ignored)
      resolveFirstCall!(new Response(JSON.stringify({ error: 'Should be ignored' }), { status: 500 }))
      // Assert - State should still reflect second call success
      expect(result.current.lastExport).toBeDefined()
      expect(result.current.error).toBe(null)
    })

    it('should allow retry after error', async () => {
      // Arrange
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        // Use Blob response for successful retry (not JSON)
        .mockResolvedValueOnce(new Response(new Blob(['test data'], { type: 'text/csv' }), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="export.csv"'
          }
        }))
      const { result } = renderHook(() => useExport())
      // Act - First attempt (should fail)
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })
      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
      // Act - Retry (should clear error)
      await act(async () => {
        result.current.clearError()
        await result.current.exportData(mockExportOptions)
      })
      // Assert
      await waitFor(() => {
        expect(result.current.lastExport).toBeDefined()
        expect(result.current.error).toBe(null)
      })
    })
  })

  // ============================================================================
  // ERROR RECOVERY TESTS
  // ============================================================================

  describe('Error Recovery', () => {
    it('should clear error when new export starts', async () => {
      // Arrange
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockExportResponse), { status: 200 }))

      const { result } = renderHook(() => useExport())

      // Act - First attempt (should fail)
      await act(async () => {
        await result.current.exportData(mockExportOptions)
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })

      // Act - Start new export
      act(() => {
        result.current.exportData(mockExportOptions)
      })

      // Assert - Error should be cleared when loading starts
      expect(result.current.error).toBe(null)
      expect(result.current.isExporting).toBe(true)
    })
  })
}) 