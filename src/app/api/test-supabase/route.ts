import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST SUPABASE CONNECTION START ===');
    
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV
    };
    
    console.log('Environment variables check:', envVars);
    
    // Authentication
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        authError: authError?.message,
        envVars
      });
    }

    console.log(`✅ Authenticated as user: ${user.id}`);

    // Test 1: List all buckets
    console.log('Test 1: Listing all buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list buckets',
        bucketsError: bucketsError.message,
        envVars,
        user: { id: user.id, email: user.email }
      });
    }

    console.log('✅ Buckets found:', buckets.length);
    console.log('Bucket names:', buckets.map((b: any) => b.name));

    // Test 2: Try to access storage directly
    console.log('Test 2: Testing direct storage access...');
    const { data: storageTest, error: storageError } = await supabase.storage
      .from('receipts')
      .list('', { limit: 1 });

    console.log('Storage test result:', { storageTest, storageError });

    // Test 3: Check if we can create a test file
    console.log('Test 3: Testing file creation...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file to verify storage access';
    
    const { data: uploadTest, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(`${user.id}/${testFileName}`, new Blob([testContent]), {
        contentType: 'text/plain'
      });

    console.log('Upload test result:', { uploadTest, uploadError });

    // Clean up test file
    if (uploadTest) {
      await supabase.storage
        .from('receipts')
        .remove([`${user.id}/${testFileName}`]);
      console.log('✅ Test file cleaned up');
    }

    console.log('=== TEST SUPABASE CONNECTION END ===');

    return NextResponse.json({
      success: true,
      message: 'Supabase connection test completed',
      envVars,
      user: { id: user.id, email: user.email },
      buckets: buckets.map((b: any) => ({
        name: b.name,
        public: b.public,
        id: b.id
      })),
      storageTest: {
        success: !storageError,
        error: storageError?.message,
        filesFound: storageTest?.length || 0
      },
      uploadTest: {
        success: !uploadError,
        error: uploadError?.message,
        fileCreated: !!uploadTest
      }
    });

  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 