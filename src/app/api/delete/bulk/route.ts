import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';
import { validateBucketName, validatePath, sanitizeString } from '@/lib/validation';

interface DeleteRequest {
  fileName: string;
  isFolder: boolean;
}

export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { bucket: bucketName, files: deleteRequests } = body as {
      bucket: string;
      files: DeleteRequest[];
    };

    if (!bucketName || !deleteRequests || !Array.isArray(deleteRequests)) {
      return NextResponse.json(
        { success: false, error: 'Bucket name and files array are required' },
        { status: 400 }
      );
    }

    // Validate bucket name
    const bucketValidation = validateBucketName(sanitizeString(bucketName));
    if (!bucketValidation.isValid) {
      return NextResponse.json(
        { success: false, error: bucketValidation.error },
        { status: 400 }
      );
    }

    // Check if user has DELETE permission for this bucket
    try {
      await requireBucketPermission(request, bucketName, 'delete');
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    const bucket = storage.bucket(bucketName);
    const results: { success: boolean; fileName: string; error?: string }[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each delete request
    for (const deleteRequest of deleteRequests) {
      const { fileName, isFolder } = deleteRequest;
      
      try {
        // Validate file/folder name
        if (!fileName) {
          results.push({
            success: false,
            fileName: fileName || 'Unknown',
            error: 'File name is required'
          });
          failureCount++;
          continue;
        }

        const pathValidation = validatePath(sanitizeString(fileName));
        if (!pathValidation.isValid) {
          results.push({
            success: false,
            fileName,
            error: pathValidation.error
          });
          failureCount++;
          continue;
        }

        if (isFolder) {
          // Delete all files in the folder
          console.log('Deleting folder:', fileName);
          
          // Ensure the folder path ends with '/'
          const folderPath = fileName.endsWith('/') ? fileName : fileName + '/';
          
          // Get all files in the folder
          const [files] = await bucket.getFiles({
            prefix: folderPath,
          });
          
          console.log(`Found ${files.length} files to delete in folder ${folderPath}`);
          
          // Delete all files in the folder
          const deletePromises = files.map(file => {
            console.log('Deleting file:', file.name);
            return file.delete();
          });
          
          await Promise.all(deletePromises);
          
          results.push({
            success: true,
            fileName,
          });
          successCount++;
        } else {
          // Delete single file from GCS
          const file = bucket.file(fileName);
          await file.delete();

          results.push({
            success: true,
            fileName,
          });
          successCount++;
        }
      } catch (error) {
        console.error(`Error deleting ${fileName}:`, error);
        results.push({
          success: false,
          fileName,
          error: `Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        failureCount++;
      }
    }

    // Return comprehensive results
    return NextResponse.json({
      success: failureCount === 0,
      message: `Bulk delete completed: ${successCount} succeeded, ${failureCount} failed`,
      successCount,
      failureCount,
      totalCount: deleteRequests.length,
      results,
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk delete request' },
      { status: 500 }
    );
  }
});