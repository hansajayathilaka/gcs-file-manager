import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { bucket: bucketName, oldPath, newName } = body;

    if (!bucketName || !oldPath || !newName) {
      return NextResponse.json(
        { success: false, error: 'Bucket, old path, and new name are required' },
        { status: 400 }
      );
    }

    // Check if user has write permission for this bucket
    try {
      await requireBucketPermission(request, bucketName, 'write');
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    const bucket = storage.bucket(bucketName);
    
    // Determine if it's a folder or file
    const isFolder = oldPath.endsWith('/');
    
    if (isFolder) {
      // Handle folder rename
      const folderPath = oldPath.endsWith('/') ? oldPath : oldPath + '/';
      const pathParts = folderPath.split('/');
      pathParts[pathParts.length - 2] = newName; // Replace folder name
      const newFolderPath = pathParts.join('/');

      // Get all files in the folder
      const [files] = await bucket.getFiles({
        prefix: folderPath,
      });

      if (files.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Folder not found or empty' },
          { status: 404 }
        );
      }

      // Move all files to new location
      const movePromises = files.map(file => {
        const newFileName = file.name.replace(folderPath, newFolderPath);
        return file.move(newFileName);
      });

      await Promise.all(movePromises);

      return NextResponse.json({
        success: true,
        message: `Folder renamed to '${newName}' successfully`,
        oldPath: folderPath,
        newPath: newFolderPath,
      });
    } else {
      // Handle file rename
      const pathParts = oldPath.split('/');
      pathParts[pathParts.length - 1] = newName; // Replace file name
      const newPath = pathParts.join('/');

      const oldFile = bucket.file(oldPath);
      const [exists] = await oldFile.exists();

      if (!exists) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }

      // Move file to new location
      await oldFile.move(newPath);

      return NextResponse.json({
        success: true,
        message: `File renamed to '${newName}' successfully`,
        oldPath,
        newPath,
      });
    }
  } catch (error) {
    console.error('Error renaming file/folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to rename file/folder' },
      { status: 500 }
    );
  }
});