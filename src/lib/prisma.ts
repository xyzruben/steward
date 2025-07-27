import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Connection pooling configuration for production performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Log queries in development for debugging
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Connection pool settings
  // These settings optimize for Supabase's connection pooler
  // Max connections: 10 (Supabase pooler limit)
  // Connection timeout: 20 seconds
  // Query timeout: 30 seconds
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 