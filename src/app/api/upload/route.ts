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
    const file = formData.get('file') as File;
    const bucketName = formData.get('bucket') as string;
    const currentPath = formData.get('currentPath') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
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

    // Upload file to GCS with path
    const bucket = storage.bucket(bucketName);
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = currentPath ? `${currentPath}${fileName}` : fileName;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const gcsFile = bucket.file(filePath);
    
    await gcsFile.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          // Store original filename in custom metadata
          originalName: file.name,
          uploadTimestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      fileName: filePath,
      originalName: file.name,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
