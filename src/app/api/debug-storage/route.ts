import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG STORAGE START ===');
    
    // Authentication
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Debugging storage for user: ${user.id}`);

    // Step 1: Try direct access to receipts bucket (skip listBuckets)
    console.log('Step 1: Testing direct access to receipts bucket...');
    
    // Try to list files in receipts bucket directly
    const { data: files, error: filesError } = await supabase.storage
      .from('receipts')
      .list('', { limit: 100 });

    if (filesError) {
      console.error('❌ Failed to access receipts bucket:', filesError);
      return NextResponse.json({
        success: false,
        step: 'bucket_access',
        error: `Failed to access receipts bucket: ${filesError.message}`
      });
    }

    console.log('✅ Receipts bucket accessible, files found:', files.length);

    // Step 2: List files in receipts bucket (already done above)
    console.log('Step 2: Files already listed above, count:', files.length);

    // Step 3: Check user-specific folder
    console.log('Step 3: Checking user folder...');
    const userFolder = `receipts/${user.id}`;
    const { data: userFiles, error: userFilesError } = await supabase.storage
      .from('receipts')
      .list(user.id, { limit: 100 });

    if (userFilesError) {
      console.error('❌ Failed to list user files:', userFilesError);
      return NextResponse.json({
        success: false,
        step: 'list_user_files',
        error: userFilesError.message,
        userFolder: userFolder
      });
    }

    console.log('✅ User files found:', userFiles.length);

    // Step 5: Test file download with a specific file
    let downloadTest = null;
    if (userFiles.length > 0) {
      console.log('Step 5: Testing file download...');
      const testFile = userFiles[0];
      const filePath = `${user.id}/${testFile.name}`;
      
      console.log(`Testing download of: ${filePath}`);
      
      const { data: testData, error: testError } = await supabase.storage
        .from('receipts')
        .download(filePath);
      
      if (testError) {
        console.error('❌ Download test failed:', testError);
        downloadTest = {
          success: false,
          error: testError.message,
          filePath: filePath
        };
      } else {
        console.log('✅ Download test successful, file size:', testData?.size);
        downloadTest = {
          success: true,
          fileSize: testData?.size,
          filePath: filePath
        };
      }
    }

    console.log('=== DEBUG STORAGE END ===');

    return NextResponse.json({
      success: true,
      message: 'Storage debug completed',
      user: {
        id: user.id,
        email: user.email
      },
      receiptsBucket: {
        name: 'receipts',
        accessible: true,
        totalFiles: files.length
      },
      userFiles: userFiles.map((f: any) => ({
        name: f.name,
        size: f.metadata?.size,
        updatedAt: f.updated_at
      })),
      downloadTest: downloadTest
    });

  } catch (error) {
    console.error('Debug storage failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 