import { NextRequest, NextResponse } from 'next/server';
import storage, { isBucketAllowed } from '@/lib/gcs';
import { adminAuth } from '@/lib/firebase-admin';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.substring(7);
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (err) {
    throw new Error('Invalid authorization token');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    await verifyAuth(request);

    const formData = await request.formData();
    const bucketName = formData.get('bucket') as string;
    const currentPath = formData.get('currentPath') as string || '';

    // Get all files from the form data
    const files: File[] = [];
    const filePaths: string[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file-') && value instanceof File) {
        files.push(value);
        const filePathKey = key.replace('file-', 'path-');
        const relativePath = formData.get(filePathKey) as string || '';
        filePaths.push(relativePath);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!bucketName) {
      return NextResponse.json(
        { success: false, error: 'No bucket specified' },
        { status: 400 }
      );
    }

    if (!isBucketAllowed(bucketName)) {
      return NextResponse.json(
        { success: false, error: 'Bucket not allowed' },
        { status: 403 }
      );
    }

    console.log('Upload API - Processing files:', {
      totalFiles: files.length,
      bucketName,
      currentPath,
      fileDetails: files.map((f, i) => ({
        name: f.name,
        relativePath: filePaths[i],
        size: f.size
      }))
    });

    const bucket = storage.bucket(bucketName);
    const uploadResults: any[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = filePaths[i];
      
      try {
        // Extract just the filename from the file name (which might include path for folder uploads)
        const actualFileName = file.name.split('/').pop() || file.name;
        
        // Generate a unique file name with timestamp
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${actualFileName}`;
        
        // Construct file path correctly
        let filePath: string;
        
        if (relativePath) {
          // This is a folder upload with relative path
          // webkitRelativePath looks like: "folder-name/subfolder/file.txt"
          const pathParts = relativePath.split('/');
          const originalFileName = pathParts[pathParts.length - 1];
          pathParts[pathParts.length - 1] = fileName; // Replace the filename with our unique one
          
          if (currentPath && currentPath.length > 0) {
            // When uploading to a specific folder, preserve the complete folder structure
            // Example: currentPath="docs", relativePath="my-folder/file.txt" 
            // Result: "docs/my-folder/1234-file.txt"
            const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
            filePath = `${normalizedCurrentPath}${pathParts.join('/')}`;
          } else {
            // When uploading to root, use the relative path as-is
            // Example: relativePath="my-folder/file.txt"
            // Result: "my-folder/1234-file.txt"
            filePath = pathParts.join('/');
          }
          
          console.log('Upload API - Folder upload path construction:', {
            originalName: actualFileName,
            relativePath,
            currentPath,
            pathParts,
            fileName,
            finalFilePath: filePath
          });
        } else {
          // Regular file upload
          if (currentPath && currentPath.length > 0) {
            const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
            filePath = `${normalizedCurrentPath}${fileName}`;
          } else {
            filePath = fileName;
          }
        }
        
        console.log('Upload API - File path construction:', {
          originalName: actualFileName,
          relativePath,
          currentPath,
          fileName,
          finalFilePath: filePath
        });
        
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const gcsFile = bucket.file(filePath);
        
        await gcsFile.save(fileBuffer, {
          metadata: {
            contentType: file.type,
            metadata: {
              // Store only the filename (not the full path) as original name
              originalName: actualFileName,
              uploadTimestamp: new Date().toISOString(),
              relativePath: relativePath || '',
            },
          },
        });

        uploadResults.push({
          success: true,
          fileName: filePath,
          originalName: actualFileName, // Just the filename, not the path
          relativePath: relativePath || '',
        });
      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        uploadResults.push({
          success: false,
          fileName: file.name.split('/').pop() || file.name, // Extract just filename for error reporting
          error: `Failed to upload ${file.name.split('/').pop() || file.name}`,
        });
      }
    }

    const successCount = uploadResults.filter(r => r.success).length;
    const failCount = uploadResults.filter(r => !r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Uploaded ${successCount} file${successCount !== 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results: uploadResults,
      totalFiles: files.length,
      successCount,
      failCount,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
