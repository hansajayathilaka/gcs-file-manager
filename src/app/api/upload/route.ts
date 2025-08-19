import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';
import { validateBucketName, validatePath, validateBulkUpload, sanitizeString } from '@/lib/validation';
import { logger } from '@/lib/logger';

export const POST = withAuth(async (request: NextRequest, user) => {
  let bucketName = '';
  try {

    const formData = await request.formData();
    bucketName = sanitizeString(formData.get('bucket') as string);
    const currentPath = sanitizeString(formData.get('currentPath') as string || '');

    // Validate bucket name
    const bucketValidation = validateBucketName(bucketName);
    if (!bucketValidation.isValid) {
      return NextResponse.json(
        { success: false, error: bucketValidation.error },
        { status: 400 }
      );
    }

    // Validate current path
    const pathValidation = validatePath(currentPath);
    if (!pathValidation.isValid) {
      return NextResponse.json(
        { success: false, error: pathValidation.error },
        { status: 400 }
      );
    }

    // Get all files from the form data
    const files: File[] = [];
    const filePaths: string[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file-') && value instanceof File) {
        files.push(value);
        const filePathKey = key.replace('file-', 'path-');
        const relativePath = sanitizeString(formData.get(filePathKey) as string || '');
        
        // Validate each file path
        const filePathValidation = validatePath(relativePath);
        if (!filePathValidation.isValid) {
          return NextResponse.json(
            { success: false, error: `Invalid file path: ${filePathValidation.error}` },
            { status: 400 }
          );
        }
        
        filePaths.push(relativePath);
      }
    }

    // Validate bulk upload
    const uploadValidation = validateBulkUpload(files);
    if (!uploadValidation.isValid) {
      return NextResponse.json(
        { success: false, error: uploadValidation.error, details: uploadValidation.details },
        { status: 400 }
      );
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

    logger.fileOperation('upload', bucketName, currentPath, user.uid);

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
          
          logger.debug('Folder upload path construction', { relativePath, filePath });
        } else {
          // Regular file upload
          if (currentPath && currentPath.length > 0) {
            const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
            filePath = `${normalizedCurrentPath}${fileName}`;
          } else {
            filePath = fileName;
          }
        }
        
        logger.debug('File path construction', { fileName, currentPath, filePath });
        
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
              uploadedBy: user.uid,
              uploaderEmail: user.email,
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
        logger.error(`Error uploading file ${file.name}`, fileError, { bucket: bucketName, userId: user.uid });
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
    logger.error('Error uploading files', error, { bucket: bucketName, userId: user.uid });
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    );
  }
});
