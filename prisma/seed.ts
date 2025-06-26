import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@steward.com' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@steward.com',
      name: 'Test User',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1234567?v=4'
    }
  })

  console.log('✅ Created test user:', user.email)

  // Create sample receipts
  const receipts = await Promise.all([
    prisma.receipt.create({
      data: {
        userId: user.id,
        imageUrl: 'https://example.com/receipt1.jpg',
        rawText: 'STARBUCKS COFFEE\n123 Main St\nDate: 2024-01-15\nTotal: $12.50',
        merchant: 'Starbucks',
        total: 12.50,
        purchaseDate: new Date('2024-01-15'),
        summary: 'Coffee purchase at Starbucks for $12.50'
      }
    }),
    prisma.receipt.create({
      data: {
        userId: user.id,
        imageUrl: 'https://example.com/receipt2.jpg',
        rawText: 'WHOLE FOODS MARKET\n456 Oak Ave\nDate: 2024-01-14\nTotal: $89.75',
        merchant: 'Whole Foods',
        total: 89.75,
        purchaseDate: new Date('2024-01-14'),
        summary: 'Grocery shopping at Whole Foods for $89.75'
      }
    }),
    prisma.receipt.create({
      data: {
        userId: user.id,
        imageUrl: 'https://example.com/receipt3.jpg',
        rawText: 'AMAZON.COM\nDate: 2024-01-13\nTotal: $45.99',
        merchant: 'Amazon',
        total: 45.99,
        purchaseDate: new Date('2024-01-13'),
        summary: 'Online purchase from Amazon for $45.99'
      }
    })
  ])

  console.log('✅ Created', receipts.length, 'sample receipts')

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 