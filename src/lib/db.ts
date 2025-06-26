import { prisma } from './prisma'
import type { User, Receipt } from '../generated/prisma'
import { Decimal } from '../generated/prisma/runtime/library'

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
}): Promise<Receipt> {
  return prisma.receipt.create({
    data: {
      ...data,
      total: new Decimal(data.total)
    }
  })
}

export async function getReceiptsByUserId(
  userId: string,
  options?: {
    skip?: number
    take?: number
    orderBy?: 'createdAt' | 'purchaseDate' | 'total'
    order?: 'asc' | 'desc'
  }
): Promise<Receipt[]> {
  const { skip = 0, take = 20, orderBy = 'createdAt', order = 'desc' } = options || {}
  
  return prisma.receipt.findMany({
    where: { userId },
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
  data: Partial<Pick<Receipt, 'merchant' | 'total' | 'purchaseDate' | 'summary'>>
): Promise<Receipt> {
  const updateData = { ...data }
  if (data.total !== undefined) {
    updateData.total = new Decimal(data.total)
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