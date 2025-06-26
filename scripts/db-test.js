const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log('✅ DB connected, user count:', userCount);
  } catch (e) {
    console.error('❌ DB connection failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 