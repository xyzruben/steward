import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== GET ERROR DETAILS START ===');
    
    // Authentication
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all failed receipts with their error details
    const failedReceipts = await prisma.receipt.findMany({
      where: {
        userId: user.id,
        merchant: {
          contains: 'Processing Failed'
        }
      },
      select: {
        id: true,
        merchant: true,
        summary: true,
        total: true,
        createdAt: true,
        imageUrl: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${failedReceipts.length} failed receipts for user ${user.id}`);

    return NextResponse.json({
      success: true,
      failedReceipts: failedReceipts.map(r => ({
        id: r.id,
        merchant: r.merchant,
        summary: r.summary,
        total: Number(r.total),
        createdAt: r.createdAt,
        imageUrl: r.imageUrl
      })),
      totalFailed: failedReceipts.length
    });

  } catch (error) {
    console.error('Get error details failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 