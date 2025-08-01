import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECK RECEIPTS DATABASE STATE ===');
    
    // Authentication
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all receipts for this user
    const receipts = await prisma.receipt.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        merchant: true,
        total: true,
        purchaseDate: true,
        summary: true,
        imageUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${receipts.length} receipts for user ${user.id}`);

    // Categorize receipts
    const processingFailed = receipts.filter(r => r.merchant?.includes('Processing Failed'));
    const successful = receipts.filter(r => !r.merchant?.includes('Processing Failed') && r.merchant !== 'Processing...');
    const processing = receipts.filter(r => r.merchant === 'Processing...');

    console.log('Receipt breakdown:', {
      total: receipts.length,
      processingFailed: processingFailed.length,
      successful: successful.length,
      processing: processing.length
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      summary: {
        total: receipts.length,
        processingFailed: processingFailed.length,
        successful: successful.length,
        processing: processing.length
      },
      receipts: receipts.map(r => ({
        id: r.id,
        merchant: r.merchant,
        total: Number(r.total),
        purchaseDate: r.purchaseDate,
        summary: r.summary,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt
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