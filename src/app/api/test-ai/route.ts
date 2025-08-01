import { NextRequest, NextResponse } from 'next/server';
import { extractReceiptDataWithAI } from '@/lib/services/openai';

// ============================================================================
// AI TEST ENDPOINT
// ============================================================================
// Tests OpenAI integration functionality
// Follows FOUNDATION_VALIDATION_CHECKLIST.md requirements

export async function GET(_request: NextRequest) {
  console.log('🤖 AI test endpoint called');
  
  try {
    // Test 1: Check OpenAI API key
    console.log('🔑 Checking OpenAI API key...');
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not found');
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured',
        details: 'OPENAI_API_KEY environment variable is missing'
      }, { status: 500 });
    }
    console.log('✅ OpenAI API key found');
    
    // Test 2: Test AI extraction with sample receipt text
    console.log('📝 Testing AI extraction...');
    const testOcrText = `WALMART
123 MAIN STREET
CITY, STATE 12345

GROCERIES
MILK 2.99
BREAD 1.99
EGGS 3.99
BANANAS 2.49

SUBTOTAL: 11.46
TAX: 0.92
TOTAL: $12.38

THANK YOU FOR SHOPPING AT WALMART
CARD: **** **** **** 1234
AUTH: 123456
REF: 789012345`;

    const startTime = Date.now();
    const aiData = await extractReceiptDataWithAI(testOcrText);
    const processingTime = Date.now() - startTime;
    
    console.log('✅ AI extraction completed in', processingTime, 'ms');
    console.log('📊 AI extraction result:', aiData);
    
    // Test 3: Validate AI response
    console.log('✅ Validating AI response...');
    const validation = {
      hasMerchant: !!aiData.merchant,
      hasTotal: typeof aiData.total === 'number' && !isNaN(aiData.total),
      hasCategory: !!aiData.category,
      hasSummary: !!aiData.summary,
      hasDate: !!aiData.purchaseDate,
      processingTime: processingTime
    };
    
    const isValid = Object.values(validation).slice(0, 5).every(Boolean);
    
    if (!isValid) {
      console.error('❌ AI response validation failed:', validation);
      return NextResponse.json({
        success: false,
        error: 'AI response validation failed',
        details: validation,
        aiData
      }, { status: 500 });
    }
    
    console.log('✅ AI response validation passed');
    
    return NextResponse.json({
      success: true,
      message: 'AI test completed successfully',
      data: {
        apiKey: 'configured',
        processingTime: {
          timeMs: processingTime,
          status: processingTime < 5000 ? 'excellent' : processingTime < 10000 ? 'good' : 'slow'
        },
        validation,
        extractedData: {
          merchant: aiData.merchant,
          total: aiData.total,
          category: aiData.category,
          purchaseDate: aiData.purchaseDate,
          summary: aiData.summary?.substring(0, 100) + '...',
          confidence: aiData.confidence
        }
      }
    });
    
  } catch (error) {
    console.error('💥 AI test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'AI test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 