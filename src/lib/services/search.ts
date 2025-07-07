// ============================================================================
// ENHANCED SEARCH SERVICE
// ============================================================================
// Advanced search capabilities for Steward receipt tracking
// See: Master System Guide - AI and Processing, Performance and Scalability

import { prisma } from '../prisma'
import { Decimal } from '@prisma/client'
import Fuse from 'fuse.js'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SearchQuery {
  query: string
  filters?: SearchFilters
  options?: SearchOptions
}

export interface SearchFilters {
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

export interface SearchOptions {
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'date' | 'amount' | 'merchant'
  sortOrder?: 'asc' | 'desc'
  includeSuggestions?: boolean
  fuzzyMatch?: boolean
}

export interface SearchResult {
  receipts: any[]
  total: number
  suggestions?: string[]
  searchAnalytics?: SearchAnalytics
  metadata: {
    queryTime: number
    cached: boolean
    timestamp: string
  }
}

export interface SearchAnalytics {
  totalResults: number
  categories: Record<string, number>
  merchants: Record<string, number>
  dateRange: { start: Date | null; end: Date | null }
  amountRange: { min: number | null; max: number | null }
}

export interface SavedSearch {
  id: string
  userId: string
  name: string
  query: string
  filters: SearchFilters
  createdAt: Date
  lastUsed: Date
  useCount: number
}

// ============================================================================
// SEARCH SERVICE CLASS
// ============================================================================

export class SearchService {
  private fuseOptions = {
    keys: [
      { name: 'merchant', weight: 0.4 },
      { name: 'summary', weight: 0.3 },
      { name: 'rawText', weight: 0.2 },
      { name: 'category', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true
  }

  // ============================================================================
  // MAIN SEARCH METHOD
  // ============================================================================

  async search(userId: string, searchQuery: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now()
    
    try {
      // Build database query with filters
      const whereClause = this.buildWhereClause(userId, searchQuery.filters)
      
      // Get base results from database
      const receipts = await prisma.receipt.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: this.buildOrderBy(searchQuery.options?.sortBy, searchQuery.options?.sortOrder),
        take: searchQuery.options?.limit || 50,
        skip: searchQuery.options?.offset || 0
      })

      // Apply fuzzy search if enabled and query provided
      let filteredResults = receipts
      if (searchQuery.query.trim() && searchQuery.options?.fuzzyMatch) {
        filteredResults = this.applyFuzzySearch(receipts, searchQuery.query)
      } else if (searchQuery.query.trim()) {
        filteredResults = this.applyExactSearch(receipts, searchQuery.query)
      }

      // Get total count for pagination
      const total = await prisma.receipt.count({ where: whereClause })

      // Generate suggestions if requested
      const suggestions = searchQuery.options?.includeSuggestions 
        ? await this.generateSuggestions(userId, searchQuery.query)
        : undefined

      // Generate search analytics
      const searchAnalytics = await this.generateSearchAnalytics(userId, searchQuery.filters)

      // Log search for analytics
      await this.logSearch(userId, searchQuery)

      return {
        receipts: filteredResults,
        total,
        suggestions,
        searchAnalytics,
        metadata: {
          queryTime: Date.now() - startTime,
          cached: false,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Search service error:', error)
      throw new Error('Search failed')
    }
  }

  // ============================================================================
  // SEARCH HELPERS
  // ============================================================================

  private buildWhereClause(userId: string, filters?: SearchFilters) {
    const whereClause: any = { userId }

    if (!filters) return whereClause

    // Category filter
    if (filters.category) {
      whereClause.category = filters.category
    }

    // Subcategory filter
    if (filters.subcategory) {
      whereClause.subcategory = { contains: filters.subcategory, mode: 'insensitive' }
    }

    // Merchant filter
    if (filters.merchant) {
      whereClause.merchant = { contains: filters.merchant, mode: 'insensitive' }
    }

    // Amount range filter
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      whereClause.total = {}
      if (filters.minAmount !== undefined) {
        whereClause.total.gte = new Decimal(filters.minAmount)
      }
      if (filters.maxAmount !== undefined) {
        whereClause.total.lte = new Decimal(filters.maxAmount)
      }
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      whereClause.purchaseDate = {}
      if (filters.startDate) {
        whereClause.purchaseDate.gte = filters.startDate
      }
      if (filters.endDate) {
        whereClause.purchaseDate.lte = filters.endDate
      }
    }

    // Confidence score filter
    if (filters.minConfidence !== undefined) {
      whereClause.confidenceScore = {
        gte: new Decimal(filters.minConfidence)
      }
    }

    return whereClause
  }

  private buildOrderBy(sortBy?: string, sortOrder?: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc'
    
    switch (sortBy) {
      case 'date':
        return { purchaseDate: order as 'asc' | 'desc' }
      case 'amount':
        return { total: order as 'asc' | 'desc' }
      case 'merchant':
        return { merchant: order as 'asc' | 'desc' }
      case 'relevance':
      default:
        return { createdAt: order as 'asc' | 'desc' }
    }
  }

  private applyFuzzySearch(receipts: any[], query: string): any[] {
    const fuse = new Fuse(receipts, this.fuseOptions)
    const results = fuse.search(query)
    return results.map(result => ({ ...result.item, relevanceScore: result.score }))
  }

  private applyExactSearch(receipts: any[], query: string): any[] {
    const searchTerm = query.toLowerCase()
    return receipts.filter(receipt => 
      receipt.merchant?.toLowerCase().includes(searchTerm) ||
      receipt.summary?.toLowerCase().includes(searchTerm) ||
      receipt.rawText?.toLowerCase().includes(searchTerm) ||
      receipt.category?.toLowerCase().includes(searchTerm)
    )
  }

  // ============================================================================
  // SUGGESTIONS AND AUTOCOMPLETE
  // ============================================================================

  async generateSuggestions(userId: string, query: string): Promise<string[]> {
    if (!query.trim()) return []

    try {
      // Get recent searches
      const recentSearches = await this.getRecentSearches(userId, query)
      
      // Get merchant suggestions
      const merchantSuggestions = await this.getMerchantSuggestions(userId, query)
      
      // Get category suggestions
      const categorySuggestions = await this.getCategorySuggestions(userId, query)

      // Combine and deduplicate suggestions
      const allSuggestions = [
        ...recentSearches,
        ...merchantSuggestions,
        ...categorySuggestions
      ]

      return [...new Set(allSuggestions)].slice(0, 10)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  private async getRecentSearches(userId: string, query: string): Promise<string[]> {
    // This would typically query a search history table
    // For now, return empty array - can be implemented later
    return []
  }

  private async getMerchantSuggestions(userId: string, query: string): Promise<string[]> {
    const merchants = await prisma.receipt.findMany({
      where: {
        userId,
        merchant: { contains: query, mode: 'insensitive' }
      },
      select: { merchant: true },
      distinct: ['merchant'],
      take: 5
    })

    return merchants.map(m => m.merchant)
  }

  private async getCategorySuggestions(userId: string, query: string): Promise<string[]> {
    const categories = await prisma.receipt.findMany({
      where: {
        userId,
        category: { contains: query, mode: 'insensitive' }
      },
      select: { category: true },
      distinct: ['category'],
      take: 5
    })

    return categories.map(c => c.category).filter((category): category is string => category !== null)
  }

  // ============================================================================
  // SEARCH ANALYTICS
  // ============================================================================

  private async generateSearchAnalytics(userId: string, filters?: SearchFilters): Promise<SearchAnalytics> {
    const whereClause = this.buildWhereClause(userId, filters)

    const [totalResults, categories, merchants, dateRange, amountRange] = await Promise.all([
      prisma.receipt.count({ where: whereClause }),
      this.getCategoryDistribution(userId, filters),
      this.getMerchantDistribution(userId, filters),
      this.getDateRange(userId, filters),
      this.getAmountRange(userId, filters)
    ])

    return {
      totalResults,
      categories,
      merchants,
      dateRange,
      amountRange
    }
  }

  private async getCategoryDistribution(userId: string, filters?: SearchFilters): Promise<Record<string, number>> {
    const whereClause = this.buildWhereClause(userId, filters)
    
    const categories = await prisma.receipt.groupBy({
      by: ['category'],
      where: whereClause,
      _count: { _all: true }
    })

    return categories.reduce((acc, cat) => {
      acc[cat.category || 'Uncategorized'] = cat._count._all
      return acc
    }, {} as Record<string, number>)
  }

  private async getMerchantDistribution(userId: string, filters?: SearchFilters): Promise<Record<string, number>> {
    const whereClause = this.buildWhereClause(userId, filters)
    
    const merchants = await prisma.receipt.groupBy({
      by: ['merchant'],
      where: whereClause,
      _count: { _all: true }
    })

    return merchants.reduce((acc, merchant) => {
      acc[merchant.merchant] = merchant._count._all
      return acc
    }, {} as Record<string, number>)
  }

  private async getDateRange(userId: string, filters?: SearchFilters): Promise<{ start: Date | null; end: Date | null }> {
    const whereClause = this.buildWhereClause(userId, filters)
    
    const [minDate, maxDate] = await Promise.all([
      prisma.receipt.findFirst({
        where: whereClause,
        orderBy: { purchaseDate: 'asc' },
        select: { purchaseDate: true }
      }),
      prisma.receipt.findFirst({
        where: whereClause,
        orderBy: { purchaseDate: 'desc' },
        select: { purchaseDate: true }
      })
    ])

    return {
      start: minDate?.purchaseDate || null,
      end: maxDate?.purchaseDate || null
    }
  }

  private async getAmountRange(userId: string, filters?: SearchFilters): Promise<{ min: number | null; max: number | null }> {
    const whereClause = this.buildWhereClause(userId, filters)
    
    const [minAmount, maxAmount] = await Promise.all([
      prisma.receipt.findFirst({
        where: whereClause,
        orderBy: { total: 'asc' },
        select: { total: true }
      }),
      prisma.receipt.findFirst({
        where: whereClause,
        orderBy: { total: 'desc' },
        select: { total: true }
      })
    ])

    return {
      min: minAmount ? Number(minAmount.total) : null,
      max: maxAmount ? Number(maxAmount.total) : null
    }
  }

  // ============================================================================
  // SEARCH LOGGING AND ANALYTICS
  // ============================================================================

  private async logSearch(userId: string, searchQuery: SearchQuery): Promise<void> {
    // This would typically log to a search_analytics table
    // For now, just log to console for development
    console.log(`Search logged for user ${userId}:`, {
      query: searchQuery.query,
      filters: searchQuery.filters,
      timestamp: new Date().toISOString()
    })
  }

  // ============================================================================
  // SAVED SEARCHES
  // ============================================================================

  async saveSearch(userId: string, name: string, query: string, filters: SearchFilters): Promise<SavedSearch> {
    try {
      const savedSearch = await prisma.savedSearch.create({
        data: {
          userId,
          name,
          query,
          filters: filters as any, // Cast to any for JSON storage
          useCount: 1,
          lastUsed: new Date(),
        }
      })

      return {
        id: savedSearch.id,
        userId: savedSearch.userId,
        name: savedSearch.name,
        query: savedSearch.query,
        filters: savedSearch.filters as SearchFilters,
        createdAt: savedSearch.createdAt,
        lastUsed: savedSearch.lastUsed,
        useCount: savedSearch.useCount,
      }
    } catch (error) {
      console.error('Error saving search:', error)
      throw new Error('Failed to save search')
    }
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const savedSearches = await prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { lastUsed: 'desc' },
      })

      return savedSearches.map(search => ({
        id: search.id,
        userId: search.userId,
        name: search.name,
        query: search.query,
        filters: search.filters as SearchFilters,
        createdAt: search.createdAt,
        lastUsed: search.lastUsed,
        useCount: search.useCount,
      }))
    } catch (error) {
      console.error('Error getting saved searches:', error)
      return []
    }
  }

  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    try {
      await prisma.savedSearch.deleteMany({
        where: {
          id: searchId,
          userId, // Ensure user can only delete their own searches
        }
      })
    } catch (error) {
      console.error('Error deleting saved search:', error)
      throw new Error('Failed to delete saved search')
    }
  }
} 