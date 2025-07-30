import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/services/cloudOcr';

export async function GET(request: NextRequest) {
  try {
    console.log('=== OCR TEST START ===');
    
    // Test with a simple base64 image (1x1 pixel)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('Testing OCR with minimal test image...');
    const result = await extractTextFromImage(testImage);
    
    console.log('OCR test completed successfully');
    console.log('=== OCR TEST END ===');
    
    return NextResponse.json({
      success: true,
      message: 'OCR test completed successfully',
      result: result.substring(0, 100) + '...' // Truncate for security
    });
    
  } catch (error) {
    console.error('OCR test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'OCR test failed'
    }, { status: 500 });
  }
} 