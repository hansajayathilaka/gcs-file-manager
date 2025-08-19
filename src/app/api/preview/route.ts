import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get('bucket');
    const file = searchParams.get('file');
    const previewType = searchParams.get('type') || 'content'; // 'content', 'metadata', or 'stream'

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

    // Handle streaming URLs for videos
    if (previewType === 'stream' && contentType.startsWith('video/')) {
      // For video streaming, return a streaming endpoint
      const streamUrl = `/api/stream?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file)}`;
      
      return NextResponse.json({
        success: true,
        streamUrl: streamUrl,
        contentType: contentType,
        size: fileSize,
        previewAvailable: true
      });
    }

    // For text files, limit preview to 1MB
    if (contentType.startsWith('text/') && fileSize <= 1024 * 1024) {
      const [content] = await fileRef.download();
      return NextResponse.json({
        success: true,
        content: content.toString('utf-8'),
        contentType: contentType,
        size: fileSize,
        previewAvailable: true
      });
    }

    // For images and audio, return a download URL instead of signed URL
    if (contentType.startsWith('image/') || contentType.startsWith('audio/')) {
      // Instead of signed URL, return the download API endpoint
      const downloadUrl = `/api/download?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file)}`;
      
      return NextResponse.json({
        success: true,
        downloadUrl: downloadUrl,
        contentType: contentType,
        size: fileSize,
        previewAvailable: true
      });
    }

    // For videos (when not requesting stream), also use download URL but warn about size
    if (contentType.startsWith('video/')) {
      const downloadUrl = `/api/download?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file)}`;
      
      return NextResponse.json({
        success: true,
        downloadUrl: downloadUrl,
        contentType: contentType,
        size: fileSize,
        previewAvailable: true,
        warning: 'Large video file - consider using stream type for better performance'
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
});
