// ============================================================================
// SIMPLIFIED SEARCH SERVICE - AI-First Architecture
// ============================================================================
// Basic text search only - optimized for performance
// Removed: Fuzzy search, complex filtering, suggestions, saved searches

import { prisma } from '../prisma'

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
  startDate?: Date
  endDate?: Date
  merchant?: string
}

export interface SearchOptions {
  limit?: number
  offset?: number
  sortBy?: 'date' | 'amount' | 'merchant'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  receipts: any[]
  total: number
  metadata: {
    queryTime: number
    timestamp: string
  }
}

// ============================================================================
// SIMPLIFIED SEARCH SERVICE CLASS
// ============================================================================

export class SearchService {
  // ============================================================================
  // MAIN SEARCH METHOD - BASIC TEXT SEARCH ONLY
  // ============================================================================

  async search(userId: string, searchQuery: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now()
    
    try {
      // Build database query with filters
      const whereClause = this.buildWhereClause(userId, searchQuery.filters, searchQuery.query)
      
      // Get results from database
      const receipts = await prisma.receipt.findMany({
        where: whereClause,
        select: {
          id: true,
          merchant: true,
          total: true,
          purchaseDate: true,
          category: true,
          summary: true,
          createdAt: true
        },
        orderBy: this.buildOrderBy(searchQuery.options?.sortBy, searchQuery.options?.sortOrder),
        take: searchQuery.options?.limit || 50,
        skip: searchQuery.options?.offset || 0
      })

      // Get total count
      const total = await prisma.receipt.count({
        where: whereClause
      })

      const queryTime = Date.now() - startTime

      return {
        receipts: receipts.map(receipt => ({
          ...receipt,
          total: Number(receipt.total)
        })),
        total,
        metadata: {
          queryTime,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Search service error:', error)
      throw new Error('Search failed')
    }
  }

  // ============================================================================
  // QUERY BUILDING - SIMPLIFIED
  // ============================================================================

  private buildWhereClause(userId: string, filters?: SearchFilters, query?: string) {
    const where: any = {
      userId
    }

    // Basic text search
    if (query && query.trim()) {
      where.OR = [
        { merchant: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Basic filters
    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.merchant) {
      where.merchant = { contains: filters.merchant, mode: 'insensitive' }
    }

    if (filters?.startDate || filters?.endDate) {
      where.purchaseDate = {}
      if (filters.startDate) {
        where.purchaseDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.purchaseDate.lte = filters.endDate
      }
    }

    return where
  }

  // ============================================================================
  // ORDERING - SIMPLIFIED
  // ============================================================================

  private buildOrderBy(sortBy?: string, sortOrder?: string) {
    const order = sortOrder === 'asc' ? 'asc' : 'desc'
    
    switch (sortBy) {
      case 'amount':
        return { total: order as 'asc' | 'desc' }
      case 'merchant':
        return { merchant: order as 'asc' | 'desc' }
      case 'date':
      default:
        return { purchaseDate: order as 'asc' | 'desc' }
    }
  }
} 