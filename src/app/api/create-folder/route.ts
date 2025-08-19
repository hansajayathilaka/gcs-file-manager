import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';
import { validateBucketName, validatePath, validateFileName, sanitizeString } from '@/lib/validation';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const { bucket, folderName, currentPath } = await request.json();

    const bucketName = sanitizeString(bucket);
    const sanitizedFolderName = sanitizeString(folderName);
    const sanitizedCurrentPath = sanitizeString(currentPath || '');

    // Validate bucket name
    const bucketValidation = validateBucketName(bucketName);
    if (!bucketValidation.isValid) {
      return NextResponse.json(
        { success: false, error: bucketValidation.error },
        { status: 400 }
      );
    }

    // Validate folder name
    const folderValidation = validateFileName(sanitizedFolderName);
    if (!folderValidation.isValid) {
      return NextResponse.json(
        { success: false, error: `Invalid folder name: ${folderValidation.error}` },
        { status: 400 }
      );
    }

    // Validate current path
    if (sanitizedCurrentPath) {
      const pathValidation = validatePath(sanitizedCurrentPath);
      if (!pathValidation.isValid) {
        return NextResponse.json(
          { success: false, error: pathValidation.error },
          { status: 400 }
        );
      }
    }

    // Check if user has WRITE permission for this bucket
    try {
      await requireBucketPermission(request, bucketName, 'write');
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    // Create the full path for the folder
    let folderPath: string;
    if (sanitizedCurrentPath && sanitizedCurrentPath.length > 0) {
      // Ensure currentPath ends with '/' if it doesn't already
      const normalizedCurrentPath = sanitizedCurrentPath.endsWith('/') ? sanitizedCurrentPath : sanitizedCurrentPath + '/';
      folderPath = `${normalizedCurrentPath}${sanitizedFolderName}/`;
    } else {
      folderPath = `${sanitizedFolderName}/`;
    }

    console.log('Creating folder:', { folderName, sanitizedFolderName, currentPath: sanitizedCurrentPath, folderPath });

    // Create an empty file to represent the folder in GCS
    const bucketRef = storage.bucket(bucketName);
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
