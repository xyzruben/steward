import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const supabase = createSupabaseServerClient(request.cookies as any);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all receipts for the user
    const receipts = await prisma.receipt.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        merchant: true,
        total: true,
        category: true,
        purchaseDate: true,
        rawText: true
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });

    // Get July 2025 receipts specifically
    const july2025Start = new Date(2025, 6, 1); // July is month 6 (0-indexed)
    const july2025End = new Date(2025, 7, 0); // Last day of July

    const julyReceipts = receipts.filter(receipt => 
      receipt.purchaseDate >= july2025Start && receipt.purchaseDate <= july2025End
    );

    // Get coffee-related receipts (by merchant name)
    const coffeeReceipts = receipts.filter(receipt => 
      receipt.merchant.toLowerCase().includes('coffee') ||
      receipt.merchant.toLowerCase().includes('tierra mia') ||
      receipt.merchant.toLowerCase().includes('starbucks') ||
      receipt.merchant.toLowerCase().includes('dunkin')
    );

    // Calculate totals
    const totalSpending = receipts.reduce((sum, receipt) => sum + Number(receipt.total), 0);
    const julySpending = julyReceipts.reduce((sum, receipt) => sum + Number(receipt.total), 0);
    const coffeeSpending = coffeeReceipts.reduce((sum, receipt) => sum + Number(receipt.total), 0);

    return NextResponse.json({
      debug: {
        totalReceipts: receipts.length,
        totalSpending: totalSpending.toFixed(2),
        julyReceipts: julyReceipts.length,
        julySpending: julySpending.toFixed(2),
        coffeeReceipts: coffeeReceipts.length,
        coffeeSpending: coffeeSpending.toFixed(2),
        julyReceiptsData: julyReceipts.map(r => ({
          merchant: r.merchant,
          total: Number(r.total).toFixed(2),
          category: r.category,
          date: r.purchaseDate.toISOString().split('T')[0]
        })),
        coffeeReceiptsData: coffeeReceipts.map(r => ({
          merchant: r.merchant,
          total: Number(r.total).toFixed(2),
          category: r.category,
          date: r.purchaseDate.toISOString().split('T')[0]
        })),
        allReceipts: receipts.map(r => ({
          merchant: r.merchant,
          total: Number(r.total).toFixed(2),
          category: r.category,
          date: r.purchaseDate.toISOString().split('T')[0]
        }))
      }
    });

  } catch (error) {
    console.error('Debug receipts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 