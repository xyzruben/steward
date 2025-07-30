import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

export async function GET(request: NextRequest) {
  try {
    console.log('=== OCR DEBUG START ===');
    
    // Check all environment variables
    const envVars = {
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      GOOGLE_APPLICATION_CREDENTIALS_JSON: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      GOOGLE_CLOUD_VISION_API_KEY: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
      NODE_ENV: process.env.NODE_ENV
    };
    
    console.log('Environment variables check:', envVars);
    
    // Check if credentials exist
    const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                          process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
                          process.env.GOOGLE_CLOUD_VISION_API_KEY ||
                          process.env.GOOGLE_CLOUD_PROJECT;
    
    console.log('Has credentials:', !!hasCredentials);
    
    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        error: 'No Google Cloud Vision credentials found',
        envVars
      });
    }
    
    // Try to create the client
    let client;
    let clientCreationMethod = 'unknown';
    
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        console.log('Attempting to create client with JSON credentials...');
        clientCreationMethod = 'JSON_CREDENTIALS';
        client = new vision.ImageAnnotatorClient({
          credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
        });
        console.log('✅ Client created with JSON credentials');
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log('Attempting to create client with key file...');
        clientCreationMethod = 'KEY_FILE';
        client = new vision.ImageAnnotatorClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
        console.log('✅ Client created with key file');
      } else {
        console.log('Attempting to create client with default credentials...');
        clientCreationMethod = 'DEFAULT';
        client = new vision.ImageAnnotatorClient();
        console.log('✅ Client created with default credentials');
      }
    } catch (clientError) {
      console.error('❌ Failed to create client:', clientError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create Google Cloud Vision client',
        clientError: clientError instanceof Error ? clientError.message : 'Unknown error',
        clientCreationMethod,
        envVars
      });
    }
    
    // Test with a simple image
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    try {
      console.log('Testing Google Cloud Vision API...');
      const [result] = await client.textDetection({
        image: {
          content: testImage.split(',')[1]
        }
      });
      
      console.log('✅ Google Cloud Vision API test successful');
      console.log('Result summary:', {
        hasError: !!result.error,
        textAnnotationsCount: result.textAnnotations?.length || 0
      });
      
      return NextResponse.json({
        success: true,
        message: 'Google Cloud Vision API is working correctly',
        clientCreationMethod,
        envVars,
        result: {
          hasError: !!result.error,
          textAnnotationsCount: result.textAnnotations?.length || 0
        }
      });
      
    } catch (apiError) {
      console.error('❌ Google Cloud Vision API test failed:', apiError);
      return NextResponse.json({
        success: false,
        error: 'Google Cloud Vision API test failed',
        apiError: apiError instanceof Error ? apiError.message : 'Unknown error',
        clientCreationMethod,
        envVars
      });
    }
    
  } catch (error) {
    console.error('OCR debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 