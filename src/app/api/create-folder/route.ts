import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const { bucket, folderName, currentPath } = await request.json();

    if (!bucket || !folderName) {
      return NextResponse.json(
        { success: false, error: 'Bucket and folder name are required' },
        { status: 400 }
      );
    }

    // Check if user has WRITE permission for this bucket
    try {
      await requireBucketPermission(request, bucket, 'write');
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    // Sanitize folder name
    const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    // Create the full path for the folder
    let folderPath: string;
    if (currentPath && currentPath.length > 0) {
      // Ensure currentPath ends with '/' if it doesn't already
      const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
      folderPath = `${normalizedCurrentPath}${sanitizedFolderName}/`;
    } else {
      folderPath = `${sanitizedFolderName}/`;
    }

    console.log('Creating folder:', { folderName, sanitizedFolderName, currentPath, folderPath });

    // Create an empty file to represent the folder in GCS
    const bucketRef = storage.bucket(bucket);
    const file = bucketRef.file(`${folderPath}.keep`);
    
    await file.save('', {
      metadata: {
        contentType: 'application/x-empty',
      },
    });

    return NextResponse.json({
      success: true,
      folderPath,
      message: 'Folder created successfully',
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    );
  }
});
