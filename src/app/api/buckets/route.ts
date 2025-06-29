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

    // List files in the specified bucket
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles();

    const fileList = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        return {
          name: file.name,
          bucket: bucketName,
          size: typeof metadata.size === 'string' ? parseInt(metadata.size) : (metadata.size || 0),
          timeCreated: metadata.timeCreated,
          updated: metadata.updated,
          contentType: metadata.contentType,
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: fileList,
    });
  } catch (error) {
    console.error('Error listing bucket contents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list bucket contents' },
      { status: 500 }
    );
  }
}
