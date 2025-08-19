import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/gcs';
import { getShareableLink, incrementLinkAccess } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Get the shareable link
    const link = await getShareableLink(token);
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found or expired' },
        { status: 404 }
      );
    }

    // Check if link has expired
    const now = new Date();
    const expiresAt = new Date(link.expiresAt);
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Link has expired' },
        { status: 410 }
      );
    }

    // Check if link is revoked
    if (link.isRevoked) {
      return NextResponse.json(
        { success: false, error: 'Link has been revoked' },
        { status: 410 }
      );
    }

    // Check max access limit
    if (link.maxAccess && link.accessCount >= link.maxAccess) {
      return NextResponse.json(
        { success: false, error: 'Link has reached maximum access limit' },
        { status: 410 }
      );
    }

    try {
      // Increment access count
      const accessAllowed = await incrementLinkAccess(token);
      if (!accessAllowed) {
        return NextResponse.json(
          { success: false, error: 'Access no longer allowed' },
          { status: 410 }
        );
      }

      // Get the file from Google Cloud Storage
      const bucket = storage.bucket(link.bucketName);
      const file = bucket.file(link.filePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }

      // Get file metadata
      const [metadata] = await file.getMetadata();
      const customMetadata = (metadata as any).metadata || {};
      const originalName = customMetadata.originalName || link.fileName;

      // Get file content
      const [fileContent] = await file.download();

      // Create response with appropriate headers for download
      const response = new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': metadata.contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(originalName)}"`,
          'Content-Length': fileContent.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      return response;
    } catch (error) {
      console.error('Error downloading shared file:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to download file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing shared link:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}