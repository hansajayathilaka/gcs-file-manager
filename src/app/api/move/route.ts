import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { bucket: bucketName, sourcePath, destinationPath } = body;

    if (!bucketName || !sourcePath || destinationPath === undefined) {
      return NextResponse.json(
        { success: false, error: 'Bucket, source path, and destination path are required' },
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
    const isFolder = sourcePath.endsWith('/');
    
    if (isFolder) {
      // Handle folder move
      const folderPath = sourcePath.endsWith('/') ? sourcePath : sourcePath + '/';
      const folderName = folderPath.split('/').filter(p => p).pop();
      const newFolderPath = destinationPath ? `${destinationPath}${folderName}/` : `${folderName}/`;

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
        const relativePath = file.name.substring(folderPath.length);
        const newFileName = `${newFolderPath}${relativePath}`;
        return file.move(newFileName);
      });

      await Promise.all(movePromises);

      return NextResponse.json({
        success: true,
        message: `Folder moved successfully`,
        sourcePath: folderPath,
        destinationPath: newFolderPath,
      });
    } else {
      // Handle file move
      const fileName = sourcePath.split('/').pop();
      const newPath = destinationPath ? `${destinationPath}${fileName}` : fileName;

      const sourceFile = bucket.file(sourcePath);
      const [exists] = await sourceFile.exists();

      if (!exists) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }

      // Move file to new location
      await sourceFile.move(newPath);

      return NextResponse.json({
        success: true,
        message: `File moved successfully`,
        sourcePath,
        destinationPath: newPath,
      });
    }
  } catch (error) {
    console.error('Error moving file/folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to move file/folder' },
      { status: 500 }
    );
  }
});