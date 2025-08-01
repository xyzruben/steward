import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { extractTextFromImage, imageBufferToBase64 } from '@/lib/services/cloudOcr';
import { extractReceiptDataWithAI } from '@/lib/services/openai';

// ============================================================================
// COMPREHENSIVE HEALTH CHECK ENDPOINT
// ============================================================================
// Validates all critical services: database, storage, OCR, and AI
// Follows FOUNDATION_VALIDATION_CHECKLIST.md requirements

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    storage: 'healthy' | 'unhealthy';
    ocr: 'healthy' | 'unhealthy';
    ai: 'healthy' | 'unhealthy';
  };
  details: {
    database?: string;
    storage?: string;
    ocr?: string;
    ai?: string;
    general?: string;
  };
  environment: {
    nodeEnv: string;
    hasOpenAIKey: boolean;
    hasGoogleCredentials: boolean;
    hasSupabaseConfig: boolean;
  };
}

export async function GET(request: NextRequest) {
  console.log('🔍 Health check endpoint called');
  
  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unhealthy',
      storage: 'unhealthy',
      ocr: 'unhealthy',
      ai: 'unhealthy'
    },
    details: {},
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasGoogleCredentials: !!(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS),
      hasSupabaseConfig: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    }
  };

  try {
    // Test 1: Database Connection
    console.log('🗄️ Testing database connection...');
    try {
      const receiptCount = await prisma.receipt.count();
      healthStatus.services.database = 'healthy';
      healthStatus.details.database = `Connected successfully. Receipt count: ${receiptCount}`;
      console.log('✅ Database connection successful');
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.details.database = `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ Database connection failed:', error);
    }

    // Test 2: Storage Connection
    console.log('📦 Testing storage connection...');
    try {
      const supabase = createSupabaseServerClient(request.cookies as any);
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw error;
      }
      
      const receiptsBucket = buckets?.find((bucket: any) => bucket.name === 'receipts');
      if (receiptsBucket) {
        healthStatus.services.storage = 'healthy';
        healthStatus.details.storage = `Storage connected. Receipts bucket found.`;
        console.log('✅ Storage connection successful');
      } else {
        healthStatus.services.storage = 'unhealthy';
        healthStatus.details.storage = 'Receipts bucket not found';
        console.error('❌ Receipts bucket not found');
      }
    } catch (error) {
      healthStatus.services.storage = 'unhealthy';
      healthStatus.details.storage = `Storage connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ Storage connection failed:', error);
    }

    // Test 3: OCR Service (Google Cloud Vision)
    console.log('📸 Testing OCR service...');
    try {
      // Create a simple test image (1x1 pixel white PNG)
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      const base64Image = imageBufferToBase64(testImageBuffer, 'image/png');
      
      // Test OCR with minimal text extraction
      const ocrText = await extractTextFromImage(base64Image);
      
      // Suppress unused variable warning
      void ocrText;
      
      healthStatus.services.ocr = 'healthy';
      healthStatus.details.ocr = `OCR service working. Test completed successfully.`;
      console.log('✅ OCR service test successful');
    } catch (error) {
      healthStatus.services.ocr = 'unhealthy';
      healthStatus.details.ocr = `OCR service failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ OCR service test failed:', error);
    }

    // Test 4: AI Service (OpenAI)
    console.log('🤖 Testing AI service...');
    try {
      const testOcrText = "WALMART\n123 MAIN ST\nGROCERIES\nTOTAL: $25.99\nTHANK YOU";
      const aiData = await extractReceiptDataWithAI(testOcrText);
      
      if (aiData && (aiData.merchant || aiData.total !== null)) {
        healthStatus.services.ai = 'healthy';
        healthStatus.details.ai = `AI service working. Test extraction successful.`;
        console.log('✅ AI service test successful');
      } else {
        throw new Error('AI service returned invalid data');
      }
    } catch (error) {
      healthStatus.services.ai = 'unhealthy';
      healthStatus.details.ai = `AI service failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ AI service test failed:', error);
    }

    // Determine overall status
    const unhealthyServices = Object.values(healthStatus.services).filter(status => status === 'unhealthy');
    const healthyServices = Object.values(healthStatus.services).filter(status => status === 'healthy');
    
    if (unhealthyServices.length === 0) {
      healthStatus.status = 'healthy';
    } else if (healthyServices.length > 0) {
      healthStatus.status = 'degraded';
    } else {
      healthStatus.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    console.log(`🏥 Health check completed in ${responseTime}ms. Status: ${healthStatus.status}`);

    return NextResponse.json(healthStatus, {
      status: healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503
    });

  } catch (error) {
    console.error('💥 Health check failed:', error);
    
    healthStatus.status = 'unhealthy';
    healthStatus.details.general = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    return NextResponse.json(healthStatus, { status: 503 });
  }
} 