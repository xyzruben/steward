import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { updateReceipt } from '@/lib/db';
import { Decimal } from '@/generated/prisma/runtime/library';
import { extractReceiptDataWithAI } from '@/lib/services/openai';
import { extractTextFromImage, imageBufferToBase64 } from '@/lib/services/cloudOcr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('=== RETRY FAILED RECEIPTS START ===');
    
    // Authentication
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all failed receipts for this user
    const failedReceipts = await prisma.receipt.findMany({
      where: {
        userId: user.id,
        merchant: 'Processing Failed'
      },
      select: {
        id: true,
        imageUrl: true,
        createdAt: true
      }
    });

    console.log(`Found ${failedReceipts.length} failed receipts for user ${user.id}`);

    if (failedReceipts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed receipts found',
        processed: 0
      });
    }

    let processedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    // Process each failed receipt with enhanced error handling
    for (const receipt of failedReceipts) {
      try {
        console.log(`Processing failed receipt: ${receipt.id}`);
        
        // Step 1: Download the image
        console.log(`Step 1: Downloading image for receipt ${receipt.id}`);
        const imageResponse = await fetch(receipt.imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        console.log(`✅ Image download successful for receipt ${receipt.id}`);
        
        // Step 2: Run OCR with detailed error handling
        console.log(`Step 2: Running OCR for receipt ${receipt.id}`);
        const base64Image = imageBufferToBase64(imageBuffer, contentType);
        const ocrText = await extractTextFromImage(base64Image);
        
        if (!ocrText || ocrText.length < 10) {
          throw new Error('OCR extracted insufficient text - image may be unclear');
        }
        console.log(`✅ OCR successful for receipt ${receipt.id}, text length: ${ocrText.length}`);
        
        // Step 3: Run AI extraction with detailed error handling
        console.log(`Step 3: Running AI extraction for receipt ${receipt.id}`);
        const aiData = await extractReceiptDataWithAI(ocrText);
        
        if (!aiData) {
          throw new Error('AI extraction returned no data');
        }
        console.log(`✅ AI extraction successful for receipt ${receipt.id}:`, aiData);
        
        // Step 4: Update receipt with extracted data
        console.log(`Step 4: Updating receipt ${receipt.id} with extracted data`);
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
        
        const errorInfo = {
          receiptId: receipt.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          step: 'unknown'
        };
        
        // Determine which step failed
        if (error instanceof Error) {
          if (error.message.includes('download')) {
            errorInfo.step = 'image_download';
          } else if (error.message.includes('OCR') || error.message.includes('insufficient text')) {
            errorInfo.step = 'ocr';
          } else if (error.message.includes('AI') || error.message.includes('extraction')) {
            errorInfo.step = 'ai_extraction';
          } else if (error.message.includes('update')) {
            errorInfo.step = 'database_update';
          }
        }
        
        errors.push(errorInfo);
        
        // Update with detailed error state
        try {
          await updateReceipt(receipt.id, {
            merchant: `Processing Failed - ${errorInfo.step}`,
            total: new Decimal(0),
            summary: `Receipt processing failed at ${errorInfo.step}: ${errorInfo.error}`
          });
        } catch (updateError) {
          console.error(`❌ Failed to update receipt ${receipt.id} with error state:`, updateError);
        }
        
        errorCount++;
      }
    }

    console.log(`=== RETRY FAILED RECEIPTS END ===`);
    console.log(`Processed: ${processedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: `Retry completed. Processed: ${processedCount}, Errors: ${errorCount}`,
      processed: processedCount,
      errors: errorCount,
      total: failedReceipts.length,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Retry failed receipts failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 