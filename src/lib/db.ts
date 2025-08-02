import { prisma } from './prisma'
import type { User, Receipt } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function createUser(data: {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}): Promise<User> {
  return prisma.user.create({
    data
  })
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id }
  })
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email }
  })
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'name' | 'avatarUrl'>>
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data
  })
}

// ============================================================================
// RECEIPT OPERATIONS
// ============================================================================

export async function createReceipt(data: {
  userId: string
  imageUrl: string
  rawText: string
  merchant: string
  total: number
  purchaseDate: Date
  summary?: string
  currency?: string // NEW: currency support
}): Promise<Receipt> {
  console.log('🔍 CREATE RECEIPT DEBUG:', {
    userId: data.userId,
    merchant: data.merchant,
    total: data.total,
    purchaseDate: data.purchaseDate
  })
  
  console.log('Data being sent to prisma.receipt.create:', {
    userId: data.userId,
    imageUrl: data.imageUrl,
    rawText: data.rawText,
    merchant: data.merchant,
    total: data.total,
    purchaseDate: data.purchaseDate,
    summary: data.summary,
    currency: data.currency // NEW: log currency
  })
  
  const result = await prisma.receipt.create({
    data: {
      userId: data.userId,
      imageUrl: data.imageUrl,
      rawText: data.rawText,
      merchant: data.merchant,
      total: new Decimal(data.total),
      purchaseDate: data.purchaseDate,
      summary: data.summary,
      currency: data.currency || 'USD' // NEW: persist currency
    }
  })
  
  console.log('🔍 RECEIPT CREATED SUCCESSFULLY:', {
    id: result.id,
    userId: result.userId,
    merchant: result.merchant,
    total: result.total,
    createdAt: result.createdAt
  })
  
  return result
}

export async function getReceiptsByUserId(
  userId: string,
  options?: {
    skip?: number
    take?: number
    orderBy?: 'createdAt' | 'purchaseDate' | 'total' | 'merchant'
    order?: 'asc' | 'desc'
    search?: string
    category?: string
    subcategory?: string
    minAmount?: number
    maxAmount?: number
    startDate?: Date
    endDate?: Date
    minConfidence?: number
  }
): Promise<Receipt[]> {
  const { 
    skip = 0, 
    take = 20, 
    orderBy = 'createdAt', 
    order = 'desc',
    search,
    category,
    subcategory,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    minConfidence
  } = options || {}
  
  // Build where clause with filters
  const whereClause: any = { userId }
  
  // Search across merchant, summary, and rawText
  if (search && search.trim()) {
    whereClause.OR = [
      { merchant: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { rawText: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  // Category filter
  if (category) {
    whereClause.category = category
  }
  
  // Subcategory filter
  if (subcategory) {
    whereClause.subcategory = subcategory
  }
  
  // Amount range filter
  if (minAmount !== undefined || maxAmount !== undefined) {
    whereClause.total = {}
    if (minAmount !== undefined) {
      whereClause.total.gte = new Decimal(minAmount)
    }
    if (maxAmount !== undefined) {
      whereClause.total.lte = new Decimal(maxAmount)
    }
  }
  
  // Date range filter
  if (startDate || endDate) {
    whereClause.purchaseDate = {}
    if (startDate) {
      whereClause.purchaseDate.gte = startDate
    }
    if (endDate) {
      whereClause.purchaseDate.lte = endDate
    }
  }
  
  // Confidence score filter
  if (minConfidence !== undefined) {
    whereClause.confidenceScore = {
      gte: new Decimal(minConfidence)
    }
  }
  
  return prisma.receipt.findMany({
    where: whereClause,
    skip,
    take,
    orderBy: { [orderBy]: order },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  return prisma.receipt.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })
}

export async function updateReceipt(
  id: string,
  data: Partial<Pick<Receipt, 'merchant' | 'total' | 'purchaseDate' | 'summary' | 'category'>> & { currency?: string }
): Promise<Receipt> {
  const updateData: any = { ...data }
  if (data.total !== undefined) {
    updateData.total = new Decimal(data.total)
  }
  if (data.currency !== undefined) {
    updateData.currency = data.currency
  }
  return prisma.receipt.update({
    where: { id },
    data: updateData
  })
}

export async function deleteReceipt(id: string): Promise<Receipt> {
  return prisma.receipt.delete({
    where: { id }
  })
}

// ============================================================================
// ANALYTICS OPERATIONS
// ============================================================================

export async function getReceiptStats(userId: string) {
  const [totalReceipts, totalSpent, averageSpent] = await Promise.all([
    prisma.receipt.count({ where: { userId } }),
    prisma.receipt.aggregate({
      where: { userId },
      _sum: { total: true }
    }),
    prisma.receipt.aggregate({
      where: { userId },
      _avg: { total: true }
    })
  ])

  return {
    totalReceipts,
    totalSpent: totalSpent._sum.total || 0,
    averageSpent: averageSpent._avg.total || 0
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ReceiptWithUser = Receipt & {
  user: Pick<User, 'id' | 'name' | 'email'>
} 