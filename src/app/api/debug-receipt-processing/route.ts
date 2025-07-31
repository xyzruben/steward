import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { extractReceiptDataWithAI } from '@/lib/services/openai';
import { extractTextFromImage, imageBufferToBase64 } from '@/lib/services/cloudOcr';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG RECEIPT PROCESSING START ===');
    
    // Authentication
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find one stuck receipt for testing
    const stuckReceipt = await prisma.receipt.findFirst({
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

    if (!stuckReceipt) {
      return NextResponse.json({
        success: false,
        message: 'No stuck receipts found for testing'
      });
    }

    console.log(`Testing with receipt: ${stuckReceipt.id}`);

    // Step 1: Test image download
    let imageBuffer: Buffer;
    let contentType: string;
    
    try {
      console.log('Step 1: Downloading image...');
      const imageResponse = await fetch(stuckReceipt.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      console.log('✅ Image download successful');
    } catch (error) {
      console.error('❌ Image download failed:', error);
      return NextResponse.json({
        success: false,
        step: 'image_download',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 2: Test OCR
    let ocrText: string;
    
    try {
      console.log('Step 2: Running OCR...');
      const base64Image = imageBufferToBase64(imageBuffer, contentType);
      ocrText = await extractTextFromImage(base64Image);
      console.log('✅ OCR successful, text length:', ocrText.length);
    } catch (error) {
      console.error('❌ OCR failed:', error);
      return NextResponse.json({
        success: false,
        step: 'ocr',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Step 3: Test AI extraction
    let aiData: any;
    
    try {
      console.log('Step 3: Running AI extraction...');
      aiData = await extractReceiptDataWithAI(ocrText);
      console.log('✅ AI extraction successful:', aiData);
    } catch (error) {
      console.error('❌ AI extraction failed:', error);
      return NextResponse.json({
        success: false,
        step: 'ai_extraction',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    console.log('=== DEBUG RECEIPT PROCESSING END ===');

    return NextResponse.json({
      success: true,
      message: 'All processing steps successful',
      receiptId: stuckReceipt.id,
      steps: {
        imageDownload: 'success',
        ocr: 'success',
        aiExtraction: 'success'
      },
      data: {
        ocrTextLength: ocrText.length,
        ocrTextPreview: ocrText.substring(0, 200) + '...',
        aiData: aiData
      }
    });

  } catch (error) {
    console.error('Debug receipt processing failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 