import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';

export const DELETE = withAuth(async (request: NextRequest, user) => {
  try {

    const { searchParams } = new URL(request.url);
    const bucketName = searchParams.get('bucket');
    const fileName = searchParams.get('file');
    const isFolder = searchParams.get('isFolder') === 'true';

    if (!bucketName || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Bucket and file name are required' },
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
      
      return NextResponse.json({
        success: true,
        message: `Folder '${fileName}' and ${files.length} files deleted successfully`,
      });
    } else {
      // Delete single file from GCS
      const file = bucket.file(fileName);
      await file.delete();

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
});
