import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
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

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const bucketName = searchParams.get('bucket');
    const fileName = searchParams.get('file');

    if (!bucketName || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Bucket and file name are required' },
        { status: 400 }
      );
    }


    // Delete file from GCS
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.delete();

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
