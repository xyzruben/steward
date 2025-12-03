// ============================================================================
// DATABASE TYPES
// ============================================================================
// Type definitions for Steward database entities
// Using Prisma-generated types for accuracy and completeness

// Import Prisma types for local use and re-export
import type { User, Receipt } from '@prisma/client'

export type { User, Receipt }

// ============================================================================
// API TYPES
// ============================================================================

export interface CreateUserRequest {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

export interface CreateReceiptRequest {
  userId: string
  imageUrl: string
  rawText: string
  merchant: string
  total: number
  purchaseDate: Date
  summary?: string
}

export interface UpdateReceiptRequest {
  merchant?: string
  total?: number
  purchaseDate?: Date
  summary?: string
}

export interface ReceiptFilters {
  skip?: number
  take?: number
  orderBy?: 'createdAt' | 'purchaseDate' | 'total'
  order?: 'asc' | 'desc'
  merchant?: string
  dateFrom?: Date
  dateTo?: Date
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ReceiptWithUser extends Receipt {
  user: Pick<User, 'id' | 'name' | 'email'>
}

export interface ReceiptStats {
  totalReceipts: number
  totalSpent: number
  averageSpent: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ReceiptSortField = 'createdAt' | 'purchaseDate' | 'total'
export type SortOrder = 'asc' | 'desc' 