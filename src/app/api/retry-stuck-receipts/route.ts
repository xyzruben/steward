import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { updateReceipt } from '@/lib/db';
import { Decimal } from '@/generated/prisma/runtime/library';
import { extractReceiptDataWithAI } from '@/lib/services/openai';
import { extractTextFromImage, imageBufferToBase64 } from '@/lib/services/cloudOcr';

export async function POST(request: NextRequest) {
  try {
    console.log('=== RETRY STUCK RECEIPTS START ===');
    
    // Authentication
    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all stuck receipts for this user
    const stuckReceipts = await prisma.receipt.findMany({
      where: {
        userId: user.id,
        merchant: 'Processing...'
      },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true
      }
    });

    console.log(`Found ${stuckReceipts.length} stuck receipts for user ${user.id}`);

    if (stuckReceipts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck receipts found',
        processed: 0
      });
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each stuck receipt
    for (const receipt of stuckReceipts) {
      try {
        console.log(`Processing stuck receipt: ${receipt.id}`);
        
        // Download the image
        const imageResponse = await fetch(receipt.imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        // Run OCR
        const base64Image = imageBufferToBase64(imageBuffer, contentType);
        const ocrText = await extractTextFromImage(base64Image);
        
        // Run AI extraction
        const aiData = await extractReceiptDataWithAI(ocrText);
        
        // Update receipt
        const merchant = aiData.merchant || 'Unknown Merchant';
        const total = typeof aiData.total === 'number' && !isNaN(aiData.total) ? aiData.total : 0;
        const purchaseDate = aiData.purchaseDate ? new Date(aiData.purchaseDate) : new Date();
        const summary = aiData.summary || 'No summary generated';
        
        await updateReceipt(receipt.id, {
          merchant,
          total: new Decimal(total),
          purchaseDate,
          summary,
          currency: aiData.currency || 'USD'
        });
        
        console.log(`✅ Successfully processed receipt: ${receipt.id}`);
        processedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to process receipt ${receipt.id}:`, error);
        
        // Update with error state
        try {
          await updateReceipt(receipt.id, {
            merchant: 'Processing Failed',
            total: new Decimal(0),
            summary: 'Receipt processing failed. Please try uploading again.'
          });
        } catch (updateError) {
          console.error(`❌ Failed to update receipt ${receipt.id} with error state:`, updateError);
        }
        
        errorCount++;
      }
    }

    console.log(`=== RETRY STUCK RECEIPTS END ===`);
    console.log(`Processed: ${processedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: `Retry completed. Processed: ${processedCount}, Errors: ${errorCount}`,
      processed: processedCount,
      errors: errorCount,
      total: stuckReceipts.length
    });

  } catch (error) {
    console.error('Retry stuck receipts failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 