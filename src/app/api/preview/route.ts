import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import storage, { isBucketAllowed } from '@/lib/gcs';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const idToken = authHeader.substring(7);
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    await verifyAuth(request);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get('bucket');
    const file = searchParams.get('file');
    const previewType = searchParams.get('type') || 'content'; // 'content' or 'metadata'

    if (!bucket || !file) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check if bucket is allowed
    if (!isBucketAllowed(bucket)) {
      return NextResponse.json({ error: 'Bucket not allowed' }, { status: 403 });
    }

    const bucketRef = storage.bucket(bucket);
    const fileRef = bucketRef.file(file);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (previewType === 'metadata') {
      // Return file metadata
      const [metadata] = await fileRef.getMetadata();
      
      return NextResponse.json({
        success: true,
        metadata: {
          name: metadata.name,
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated,
          md5Hash: metadata.md5Hash,
          crc32c: metadata.crc32c,
          etag: metadata.etag,
          generation: metadata.generation,
          customMetadata: metadata.metadata,
        }
      });
    }

    // For content preview, check file size and type
    const [metadata] = await fileRef.getMetadata();
    const fileSize = typeof metadata.size === 'string' ? parseInt(metadata.size) : (metadata.size || 0);
    const contentType = metadata.contentType || '';

    // For text files, limit preview to 1MB
    if (contentType.startsWith('text/') && fileSize <= 1024 * 1024) {
      const [content] = await fileRef.download();
      return NextResponse.json({
        success: true,
        content: content.toString('utf-8'),
        contentType: contentType,
        size: fileSize
      });
    }

    // For images, videos, and audio, return a download URL instead of signed URL
    if (contentType.startsWith('image/') || contentType.startsWith('video/') || contentType.startsWith('audio/')) {
      // Instead of signed URL, return the download API endpoint
      const downloadUrl = `/api/download?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file)}`;
      
      return NextResponse.json({
        success: true,
        downloadUrl: downloadUrl,
        contentType: contentType,
        size: fileSize
      });
    }

    // For other files, just return metadata
    return NextResponse.json({
      success: true,
      contentType: contentType,
      size: fileSize,
      previewAvailable: false
    });

  } catch (error) {
    console.error('Error in preview API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
