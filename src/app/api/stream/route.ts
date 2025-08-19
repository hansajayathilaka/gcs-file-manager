import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { verifyAuth, requireBucketPermission } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication (supports both header and query parameter for video streaming)
    const user = await verifyAuth(request);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get('bucket');
    const file = searchParams.get('file');

    if (!bucket || !file) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check if user has READ permission for this bucket
    try {
      await requireBucketPermission(request, bucket, 'read');
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const bucketRef = storage.bucket(bucket);
    const fileRef = bucketRef.file(file);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file metadata
    const [metadata] = await fileRef.getMetadata();
    const fileSize = typeof metadata.size === 'string' ? parseInt(metadata.size) : (metadata.size || 0);
    const contentType = metadata.contentType || 'application/octet-stream';

    // Handle range requests for video streaming
    const range = request.headers.get('range');
    
    if (range) {
      // Parse range header (e.g., "bytes=0-1023" or "bytes=1024-")
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = (end - start) + 1;
      
      // Create a readable stream for the specified range
      const stream = fileRef.createReadStream({
        start: start,
        end: end,
      });

      // Convert Node.js readable stream to Web Stream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          
          stream.on('end', () => {
            controller.close();
          });
          
          stream.on('error', (err) => {
            controller.error(err);
          });
        },
      });

      return new NextResponse(webStream, {
        status: 206, // Partial Content
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } else {
      // No range requested, return the full file stream
      const stream = fileRef.createReadStream();

      // Convert Node.js readable stream to Web Stream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          
          stream.on('end', () => {
            controller.close();
          });
          
          stream.on('error', (err) => {
            controller.error(err);
          });
        },
      });

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

  } catch (error) {
    console.error('Error in stream API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
