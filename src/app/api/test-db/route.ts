import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ============================================================================
// DATABASE TEST ENDPOINT
// ============================================================================
// Tests Prisma database functionality
// Follows FOUNDATION_VALIDATION_CHECKLIST.md requirements

export async function GET(request: NextRequest) {
  console.log('🗄️ Database test endpoint called');
  
  try {
    // Test 1: Basic connection
    console.log('🔌 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Test 2: Count receipts
    console.log('📊 Testing receipt count...');
    const receiptCount = await prisma.receipt.count();
    console.log('✅ Receipt count:', receiptCount);
    
    // Test 3: Count users
    console.log('👥 Testing user count...');
    const userCount = await prisma.user.count();
    console.log('✅ User count:', userCount);
    
    // Test 4: Test basic query performance
    console.log('⚡ Testing query performance...');
    const startTime = Date.now();
    const recentReceipts = await prisma.receipt.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        merchant: true,
        total: true,
        createdAt: true
      }
    });
    const queryTime = Date.now() - startTime;
    console.log('✅ Query performance test completed in', queryTime, 'ms');
    
    // Test 5: Check database schema
    console.log('🏗️ Testing database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('✅ Database schema check completed');
    
    return NextResponse.json({
      success: true,
      message: 'Database test completed successfully',
      data: {
        connection: 'healthy',
        receiptCount,
        userCount,
        queryPerformance: {
          timeMs: queryTime,
          status: queryTime < 1000 ? 'excellent' : queryTime < 5000 ? 'good' : 'slow'
        },
        recentReceipts: recentReceipts.map(r => ({
          id: r.id,
          merchant: r.merchant,
          total: r.total?.toString(),
          createdAt: r.createdAt
        })),
        schema: {
          tables: (tables as any[]).map(t => t.table_name)
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 