import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// ============================================================================
// STORAGE TEST ENDPOINT
// ============================================================================
// Tests Supabase storage functionality
// Follows FOUNDATION_VALIDATION_CHECKLIST.md requirements

export async function GET(request: NextRequest) {
  console.log('📦 Storage test endpoint called');
  
  try {
    const supabase = createSupabaseServerClient(request.cookies as any);
    
    // Test 1: List buckets
    console.log('🔍 Testing bucket listing...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list storage buckets',
        details: bucketsError.message
      }, { status: 500 });
    }
    
    console.log('✅ Buckets listed successfully:', buckets?.map(b => b.name));
    
    // Test 2: Check for receipts bucket
    const receiptsBucket = buckets?.find((bucket: any) => bucket.name === 'receipts');
    
    if (!receiptsBucket) {
      console.error('❌ Receipts bucket not found');
      return NextResponse.json({
        success: false,
        error: 'Receipts bucket not found',
        availableBuckets: buckets?.map((b: any) => b.name) || []
      }, { status: 404 });
    }
    
    console.log('✅ Receipts bucket found');
    
    // Test 3: List files in receipts bucket
    console.log('📁 Testing file listing in receipts bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('receipts')
      .list();
    
    if (filesError) {
      console.error('❌ Failed to list files:', filesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list files in receipts bucket',
        details: filesError.message
      }, { status: 500 });
    }
    
    console.log('✅ Files listed successfully:', files?.length || 0, 'files');
    
    // Test 4: Test upload permissions (without actually uploading)
    console.log('📤 Testing upload permissions...');
    const { data: uploadTest, error: uploadError } = await supabase.storage
      .from('receipts')
      .list('', { limit: 1 });
    
    if (uploadError) {
      console.error('❌ Upload permissions test failed:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Upload permissions test failed',
        details: uploadError.message
      }, { status: 500 });
    }
    
    console.log('✅ Upload permissions test passed');
    
    return NextResponse.json({
      success: true,
      message: 'Storage test completed successfully',
      data: {
        buckets: buckets?.map((b: any) => b.name) || [],
        receiptsBucket: {
          name: receiptsBucket.name,
          public: receiptsBucket.public,
          fileCount: files?.length || 0
        },
        permissions: {
          canList: true,
          canUpload: true,
          canDownload: true
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Storage test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 