import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECK RECEIPTS START ===');
    
    // Authentication
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all receipts for this user
    const receipts = await prisma.receipt.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        merchant: true,
        total: true,
        summary: true,
        createdAt: true,
        purchaseDate: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${receipts.length} total receipts for user ${user.id}`);

    // Categorize receipts by status
    const processingReceipts = receipts.filter(r => r.merchant === 'Processing...');
    const failedReceipts = receipts.filter(r => r.merchant === 'Processing Failed');
    const successfulReceipts = receipts.filter(r => r.merchant !== 'Processing...' && r.merchant !== 'Processing Failed');

    return NextResponse.json({
      success: true,
      totalReceipts: receipts.length,
      processing: processingReceipts.length,
      failed: failedReceipts.length,
      successful: successfulReceipts.length,
      receipts: receipts.map(r => ({
        id: r.id,
        merchant: r.merchant,
        total: Number(r.total),
        summary: r.summary,
        createdAt: r.createdAt,
        purchaseDate: r.purchaseDate
      }))
    });

  } catch (error) {
    console.error('Check receipts failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 