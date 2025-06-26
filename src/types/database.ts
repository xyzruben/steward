// ============================================================================
// DATABASE TYPES
// ============================================================================
// Type definitions for Steward database entities
// These will be replaced by generated Prisma types once client is generated

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Receipt {
  id: string
  userId: string
  imageUrl: string
  rawText: string
  merchant: string
  total: number
  purchaseDate: Date
  summary: string | null
  createdAt: Date
  updatedAt: Date
}

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