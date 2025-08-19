import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { bucket: bucketName, sourcePath, destinationPath, newName } = body;

    if (!bucketName || !sourcePath || destinationPath === undefined) {
      return NextResponse.json(
        { success: false, error: 'Bucket, source path, and destination path are required' },
        { status: 400 }
      );
    }

    // Check if user has read and write permission for this bucket
    try {
      await requireBucketPermission(request, bucketName, 'read');
      await requireBucketPermission(request, bucketName, 'write');
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    const bucket = storage.bucket(bucketName);
    
    // Determine if it's a folder or file
    const isFolder = sourcePath.endsWith('/');
    
    if (isFolder) {
      // Handle folder copy
      const folderPath = sourcePath.endsWith('/') ? sourcePath : sourcePath + '/';
      const folderName = folderPath.split('/').filter(p => p).pop();
      const finalName = newName || folderName;
      const newFolderPath = destinationPath ? `${destinationPath}${finalName}/` : `${finalName}/`;

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

      // Copy all files to new location
      const copyPromises = files.map(file => {
        const relativePath = file.name.substring(folderPath.length);
        const newFileName = `${newFolderPath}${relativePath}`;
        return file.copy(newFileName);
      });

      await Promise.all(copyPromises);

      return NextResponse.json({
        success: true,
        message: `Folder copied successfully`,
        sourcePath: folderPath,
        destinationPath: newFolderPath,
        filesCopied: files.length,
      });
    } else {
      // Handle file copy
      const originalFileName = sourcePath.split('/').pop();
      const finalName = newName || originalFileName;
      const newPath = destinationPath ? `${destinationPath}${finalName}` : finalName;

      const sourceFile = bucket.file(sourcePath);
      const [exists] = await sourceFile.exists();

      if (!exists) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }

      // Copy file to new location
      await sourceFile.copy(newPath);

      return NextResponse.json({
        success: true,
        message: `File copied successfully`,
        sourcePath,
        destinationPath: newPath,
      });
    }
  } catch (error) {
    console.error('Error copying file/folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to copy file/folder' },
      { status: 500 }
    );
  }
});