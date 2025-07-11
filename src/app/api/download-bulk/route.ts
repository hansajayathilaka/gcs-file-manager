import { NextRequest, NextResponse } from 'next/server';
import storage, { isBucketAllowed } from '@/lib/gcs';
import { adminAuth } from '@/lib/firebase-admin';
import archiver from 'archiver';
import { Readable } from 'stream';

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

    const body = await request.json();
    const { bucket: bucketName, files } = body;

    if (!bucketName || !files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bucket and files array are required' },
        { status: 400 }
      );
    }

    if (!isBucketAllowed(bucketName)) {
      return NextResponse.json(
        { success: false, error: 'Bucket not allowed' },
        { status: 403 }
      );
    }

    const bucket = storage.bucket(bucketName);

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Create a readable stream from the archive
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk: any) => {
          controller.enqueue(chunk);
        });

        archive.on('end', () => {
          controller.close();
        });

        archive.on('error', (err: any) => {
          controller.error(err);
        });

        // Process files and add to archive
        processFiles();

        async function processFiles() {
          try {
            for (const filePath of files) {
              const file = bucket.file(filePath);
              
              // Check if file exists
              const [exists] = await file.exists();
              if (!exists) {
                console.warn(`File not found: ${filePath}`);
                continue;
              }

              // Get file metadata to determine original filename
              const [metadata] = await file.getMetadata();
              const customMetadata = (metadata as any).metadata || {};
              const originalName = customMetadata.originalName || filePath.split('/').pop() || 'file';

              // Download file content
              const [fileContent] = await file.download();
              
              // Add file to archive with original name
              archive.append(fileContent, { name: originalName });
            }

            // Finalize the archive
            archive.finalize();
          } catch (error) {
            console.error('Error processing files:', error);
            controller.error(error);
          }
        }
      }
    });

    // Generate filename for the zip
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `files-${timestamp}.zip`;

    // Return the zip file as response
    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error creating bulk download:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bulk download' },
      { status: 500 }
    );
  }
}
