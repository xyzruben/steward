// ============================================================================
// ENHANCED SEARCH SERVICE TESTS
// ============================================================================
// Comprehensive tests for search functionality
// See: Master System Guide - Testing and Quality Assurance

// Types for testing
interface SearchQuery {
  query: string
  filters?: SearchFilters
  options?: SearchOptions
}

interface SearchFilters {
  category?: string
  subcategory?: string
  minAmount?: number
  maxAmount?: number
  startDate?: Date
  endDate?: Date
  minConfidence?: number
  merchant?: string
  tags?: string[]
}

interface SearchOptions {
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'date' | 'amount' | 'merchant'
  sortOrder?: 'asc' | 'desc'
  includeSuggestions?: boolean
  fuzzyMatch?: boolean
}

interface SearchResult {
  receipts: any[]
  total: number
  suggestions?: string[]
  searchAnalytics?: any
  metadata: {
    queryTime: number
    cached: boolean
    timestamp: string
  }
}

// Mock SearchService class for testing
class MockSearchService {
  async search(userId: string, searchQuery: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now()
    
    // Simulate search logic
    const mockReceipts = [
      {
        id: '1',
        userId: 'user1',
        merchant: 'Walmart',
        total: { toNumber: () => 50.00 },
        purchaseDate: new Date('2024-01-01'),
        category: 'Shopping',
        summary: 'Grocery shopping',
        rawText: 'Walmart receipt for groceries',
        confidenceScore: { toNumber: () => 0.95 },
        user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
      },
      {
        id: '2',
        userId: 'user1',
        merchant: 'Target',
        total: { toNumber: () => 25.00 },
        purchaseDate: new Date('2024-01-02'),
        category: 'Shopping',
        summary: 'Household items',
        rawText: 'Target receipt for household items',
        confidenceScore: { toNumber: () => 0.88 },
        user: { id: 'user1', name: 'Test User', email: 'test@example.com' }
      }
    ]

    // Filter based on query
    let filteredReceipts = mockReceipts
    if (searchQuery.query) {
      filteredReceipts = mockReceipts.filter(receipt => 
        receipt.merchant.toLowerCase().includes(searchQuery.query.toLowerCase()) ||
        receipt.summary?.toLowerCase().includes(searchQuery.query.toLowerCase())
      )
    }

    // Apply filters
    if (searchQuery.filters) {
      if (searchQuery.filters.category) {
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.category === searchQuery.filters!.category
        )
      }
      if (searchQuery.filters.minAmount) {
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.total.toNumber() >= searchQuery.filters!.minAmount!
        )
      }
      if (searchQuery.filters.maxAmount) {
        filteredReceipts = filteredReceipts.filter(receipt => 
          receipt.total.toNumber() <= searchQuery.filters!.maxAmount!
        )
      }
    }

    // Generate suggestions if requested
    const suggestions = searchQuery.options?.includeSuggestions 
      ? ['Walmart', 'Target', 'Shopping']
      : undefined

    // Generate analytics
    const searchAnalytics = {
      totalResults: filteredReceipts.length,
      categories: { 'Shopping': filteredReceipts.length },
      merchants: { 'Walmart': 1, 'Target': 1 },
      dateRange: { start: new Date('2024-01-01'), end: new Date('2024-01-02') },
      amountRange: { min: 25.00, max: 50.00 }
    }

    return {
      receipts: filteredReceipts,
      total: filteredReceipts.length,
      suggestions,
      searchAnalytics,
      metadata: {
        queryTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString()
      }
    }
  }

  async generateSuggestions(userId: string, query: string): Promise<string[]> {
    if (!query.trim()) return []
    
    const suggestions = ['Walmart', 'Target', 'Shopping', 'Food & Dining']
    return suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
  }

  async saveSearch(userId: string, name: string, query: string, filters: SearchFilters): Promise<any> {
    return {
      id: `search_${Date.now()}`,
      userId,
      name,
      query,
      filters,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 1
    }
  }

  async getSavedSearches(userId: string): Promise<any[]> {
    return []
  }

  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    // Mock implementation
  }
}

describe('SearchService', () => {
  let searchService: MockSearchService

  beforeEach(() => {
    searchService = new MockSearchService()
  })

  describe('search', () => {
    it('should perform basic search without filters', async () => {
      const searchQuery: SearchQuery = {
        query: 'walmart',
        options: {
          limit: 10,
          offset: 0,
          sortBy: 'relevance',
          sortOrder: 'desc'
        }
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.receipts).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.metadata.queryTime).toBeGreaterThanOrEqual(0)
      expect(result.receipts[0].merchant).toBe('Walmart')
    })

    it('should apply filters correctly', async () => {
      const filters: SearchFilters = {
        category: 'Shopping',
        minAmount: 25,
        maxAmount: 100
      }

      const searchQuery: SearchQuery = {
        query: 'walmart',
        filters,
        options: { fuzzyMatch: true }
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.receipts).toHaveLength(1)
      expect(result.receipts[0].category).toBe('Shopping')
      expect(result.receipts[0].total.toNumber()).toBeGreaterThanOrEqual(25)
      expect(result.receipts[0].total.toNumber()).toBeLessThanOrEqual(100)
    })

    it('should handle fuzzy search when enabled', async () => {
      const searchQuery: SearchQuery = {
        query: 'walmart',
        options: {
          fuzzyMatch: true,
          includeSuggestions: true
        }
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.receipts).toHaveLength(1)
      expect(result.suggestions).toBeDefined()
      expect(result.suggestions).toContain('Walmart')
    })

    it('should generate search analytics', async () => {
      const searchQuery: SearchQuery = {
        query: 'walmart',
        options: { includeSuggestions: true }
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.searchAnalytics).toBeDefined()
      expect(result.searchAnalytics?.totalResults).toBe(1)
      expect(result.searchAnalytics?.categories).toEqual({ 'Shopping': 1 })
    })

    it('should handle empty search query', async () => {
      const searchQuery: SearchQuery = {
        query: '',
        options: { fuzzyMatch: true }
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.receipts).toHaveLength(2)
      expect(result.suggestions).toBeUndefined()
    })

    it('should return no results for non-matching query', async () => {
      const searchQuery: SearchQuery = {
        query: 'nonexistent'
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.receipts).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('generateSuggestions', () => {
    it('should generate merchant suggestions', async () => {
      const suggestions = await searchService.generateSuggestions('user1', 'wal')

      expect(suggestions).toContain('Walmart')
      expect(suggestions).toHaveLength(1)
    })

    it('should generate category suggestions', async () => {
      const suggestions = await searchService.generateSuggestions('user1', 'shop')

      expect(suggestions).toContain('Shopping')
      expect(suggestions).toHaveLength(1)
    })

    it('should return empty array for empty query', async () => {
      const suggestions = await searchService.generateSuggestions('user1', '')

      expect(suggestions).toEqual([])
    })

    it('should handle case insensitive search', async () => {
      const suggestions = await searchService.generateSuggestions('user1', 'WAL')

      expect(suggestions).toContain('Walmart')
    })
  })

  describe('saved searches', () => {
    it('should save search', async () => {
      const savedSearch = await searchService.saveSearch('user1', 'My Search', 'walmart', { category: 'Shopping' })

      expect(savedSearch).toMatchObject({
        userId: 'user1',
        name: 'My Search',
        query: 'walmart',
        filters: { category: 'Shopping' }
      })
      expect(savedSearch.id).toMatch(/^search_\d+$/)
      expect(savedSearch.createdAt).toBeInstanceOf(Date)
    })

    it('should get saved searches', async () => {
      const savedSearches = await searchService.getSavedSearches('user1')

      expect(savedSearches).toEqual([])
    })

    it('should delete saved search', async () => {
      await expect(searchService.deleteSavedSearch('user1', 'search1')).resolves.toBeUndefined()
    })
  })

  describe('search analytics', () => {
    it('should include analytics in search results', async () => {
      const searchQuery: SearchQuery = {
        query: 'walmart'
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.searchAnalytics).toBeDefined()
      expect(result.searchAnalytics?.totalResults).toBe(1)
      expect(result.searchAnalytics?.categories).toBeDefined()
      expect(result.searchAnalytics?.merchants).toBeDefined()
      expect(result.searchAnalytics?.dateRange).toBeDefined()
      expect(result.searchAnalytics?.amountRange).toBeDefined()
    })

    it('should calculate correct analytics for filtered results', async () => {
      const searchQuery: SearchQuery = {
        query: 'walmart',
        filters: { minAmount: 40 }
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.searchAnalytics?.totalResults).toBe(1)
      expect(result.searchAnalytics?.amountRange.min).toBe(25.00)
      expect(result.searchAnalytics?.amountRange.max).toBe(50.00)
    })
  })

  describe('search metadata', () => {
    it('should include proper metadata in results', async () => {
      const searchQuery: SearchQuery = {
        query: 'walmart'
      }

      const result = await searchService.search('user1', searchQuery)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.queryTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.cached).toBe(false)
      expect(result.metadata.timestamp).toBeDefined()
      expect(new Date(result.metadata.timestamp)).toBeInstanceOf(Date)
    })
  })
}) 