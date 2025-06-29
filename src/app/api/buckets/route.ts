import { NextRequest, NextResponse } from 'next/server';
import storage, { getAllowedBuckets, isBucketAllowed } from '@/lib/gcs';
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

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const bucketName = searchParams.get('bucket');
    const prefix = searchParams.get('prefix') || '';
    const getAllFolders = searchParams.get('getAllFolders') === 'true';

    if (!bucketName) {
      // Return list of allowed buckets
      const allowedBuckets = getAllowedBuckets();
      return NextResponse.json({
        success: true,
        buckets: allowedBuckets.map(name => ({ name })),
      });
    }

    if (!isBucketAllowed(bucketName)) {
      return NextResponse.json(
        { success: false, error: 'Bucket not allowed' },
        { status: 403 }
      );
    }

    // List files and folders in the specified bucket with prefix
    const bucket = storage.bucket(bucketName);
    
    if (getAllFolders) {
      // Get all files in the bucket to build complete folder structure
      const [allFiles] = await bucket.getFiles();
      
      const folderSet = new Set<string>();
      
      allFiles.forEach(file => {
        const pathParts = file.name.split('/');
        // Add all parent folders
        for (let i = 1; i < pathParts.length; i++) {
          const folderPath = pathParts.slice(0, i).join('/') + '/';
          folderSet.add(folderPath);
        }
      });
      
      // Convert to folder items
      const allFolderItems = Array.from(folderSet)
        .filter(path => path !== '/')
        .map(path => ({
          name: path.split('/').filter(p => p).pop() || '',
          path: path.replace(/\/$/, ''), // Remove trailing slash for consistency
          isFolder: true,
          bucket: bucketName,
        }));
      
      return NextResponse.json({
        success: true,
        files: allFolderItems,
        currentPath: '',
      });
    }
    
    // Normal file listing with prefix and delimiter
    
    // Get all objects with the specified prefix and delimiter
    const [files, , apiResponse] = await bucket.getFiles({
      prefix: prefix,
      delimiter: '/',
    });

    // Extract folder prefixes from the API response
    const folderPrefixes = (apiResponse as any)?.prefixes || [];
    
    console.log('Debug folder listing:', {
      prefix,
      folderPrefixes,
      filesCount: files.length,
      allFileNames: files.map(f => f.name)
    });
    
    // Process folders from prefixes (these are virtual folders)
    const folderItems = folderPrefixes.map((folderPrefix: string) => {
      const folderName = folderPrefix.slice(prefix.length, -1); // Remove prefix and trailing slash
      return {
        name: folderName,
        path: folderPrefix,
        isFolder: true,
        bucket: bucketName,
      };
    });

    // Also check for .keep files that represent folders
    const keepFiles = files.filter(file => file.name.endsWith('/.keep'));
    const folderItemsFromKeep = keepFiles.map(file => {
      const folderPath = file.name.slice(0, -6); // Remove '/.keep'
      const relativeFolderPath = folderPath.slice(prefix.length);
      if (relativeFolderPath && !folderPrefixes.includes(folderPath + '/')) {
        return {
          name: relativeFolderPath,
          path: folderPath + '/',
          isFolder: true,
          bucket: bucketName,
        };
      }
      return null;
    }).filter(Boolean) as any[];

    // Combine folder sources and remove duplicates
    const allFolderItems = [...folderItems];
    folderItemsFromKeep.forEach(keepFolder => {
      if (!allFolderItems.some(f => f.path === keepFolder.path)) {
        allFolderItems.push(keepFolder);
      }
    });

    // Process files (exclude folder placeholder files)
    const fileItems = await Promise.all(
      files
        .filter(file => {
          // Only include files that don't end with '/' and aren't the current prefix
          const relativePath = file.name.slice(prefix.length);
          return !file.name.endsWith('/') && 
                 file.name !== prefix && 
                 relativePath && 
                 !relativePath.includes('/') && // Only files in current directory
                 !file.name.endsWith('.keep'); // Filter out folder placeholder files
        })
        .map(async (file) => {
          const [metadata] = await file.getMetadata();
          const fileName = file.name.slice(prefix.length);
          
          // Use original filename from custom metadata if available, otherwise use the stored filename
          const customMetadata = (metadata as any).metadata || {};
          const displayName = customMetadata.originalName || fileName;
          
          return {
            name: displayName,
            path: file.name,
            isFolder: false,
            bucket: bucketName,
            size: typeof metadata.size === 'string' ? parseInt(metadata.size) : (metadata.size || 0),
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            contentType: metadata.contentType,
            originalName: customMetadata.originalName,
            storedPath: file.name, // Keep the actual storage path for operations
          };
        })
    );

    // Combine folders and files
    const allItems = [...allFolderItems, ...fileItems];

    return NextResponse.json({
      success: true,
      files: allItems,
      currentPath: prefix,
    });
  } catch (error) {
    console.error('Error listing bucket contents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list bucket contents' },
      { status: 500 }
    );
  }
}
