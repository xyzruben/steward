import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

export async function GET(request: NextRequest) {
  try {
    console.log('=== OCR TEST START ===');
    
    // Check if credentials exist
    const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                          process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
                          process.env.GOOGLE_CLOUD_VISION_API_KEY ||
                          process.env.GOOGLE_CLOUD_PROJECT;
    
    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        error: 'No Google Cloud Vision credentials found',
        message: 'OCR processing not available - please configure Google Cloud Vision API credentials'
      });
    }
    
    // Create the client
    let client;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      client = new vision.ImageAnnotatorClient({
        credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      client = new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
    } else {
      client = new vision.ImageAnnotatorClient();
    }
    
    // Test with a simple base64 image (1x1 pixel - no text expected)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('Testing Google Cloud Vision API...');
    const [result] = await client.textDetection({
      image: {
        content: testImage.split(',')[1]
      }
    });
    
    console.log('OCR test completed successfully');
    console.log('=== OCR TEST END ===');
    
    // Check if we got any text annotations
    const hasText = result.textAnnotations && result.textAnnotations.length > 0;
    const extractedText = hasText ? result.textAnnotations![0].description : 'No text found in test image';
    
    return NextResponse.json({
      success: true,
      message: 'Google Cloud Vision API is working correctly',
      result: extractedText,
      hasText,
      textAnnotationsCount: result.textAnnotations?.length || 0
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