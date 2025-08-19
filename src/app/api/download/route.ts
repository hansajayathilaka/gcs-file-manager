import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { withAuth, requireBucketPermission } from '@/lib/auth-middleware';

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {

    const { searchParams } = new URL(request.url);
    const bucketName = searchParams.get('bucket');
    const filePath = searchParams.get('file');

    if (!bucketName || !filePath) {
      return NextResponse.json(
        { success: false, error: 'Bucket and file path are required' },
        { status: 400 }
      );
    }

    // Check if user has READ permission for this bucket
    try {
      await requireBucketPermission(request, bucketName, 'read');
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file metadata to determine original filename
    const [metadata] = await file.getMetadata();
    const customMetadata = (metadata as any).metadata || {};
    const originalName = customMetadata.originalName || filePath.split('/').pop() || 'download';

    // Get file content
    const [fileContent] = await file.download();

    // Create response with appropriate headers for download
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName)}"`,
        'Content-Length': fileContent.length.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 }
    );
  }
});
