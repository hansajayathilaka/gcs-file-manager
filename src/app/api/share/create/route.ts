import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { createShareableLink, hasUserBucketAccess, getUserPermissions } from '@/lib/database';
import { ShareableLinkRequest, ShareableLinkResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const body: ShareableLinkRequest = await request.json();
    const { bucketName, filePath, expiresInHours, maxAccess, description } = body;

    // Validate input
    if (!bucketName || !filePath || !expiresInHours) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bucketName, filePath, expiresInHours' },
        { status: 400 }
      );
    }

    if (expiresInHours <= 0 || expiresInHours > 8760) { // Max 1 year
      return NextResponse.json(
        { success: false, error: 'expiresInHours must be between 1 and 8760 (1 year)' },
        { status: 400 }
      );
    }

    if (maxAccess && (maxAccess <= 0 || maxAccess > 10000)) {
      return NextResponse.json(
        { success: false, error: 'maxAccess must be between 1 and 10000' },
        { status: 400 }
      );
    }

    // Check if user has read access to the bucket
    const hasAccess = await hasUserBucketAccess(user.uid, bucketName);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No access to this bucket' },
        { status: 403 }
      );
    }

    // Check if user has read permission (needed to share)
    const permissions = await getUserPermissions(user.uid, bucketName);
    if (!permissions || !permissions.permissions.includes('read')) {
      return NextResponse.json(
        { success: false, error: 'Read permission required to share files' },
        { status: 403 }
      );
    }

    // Extract file name from path
    const fileName = filePath.split('/').pop() || filePath;

    // Create the shareable link
    const shareableLink = await createShareableLink({
      bucketName,
      filePath,
      fileName,
      createdBy: user.uid,
      expiresInHours,
      maxAccess,
      description,
    });

    // Construct the share URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const shareUrl = `${protocol}://${host}/share/${shareableLink.token}`;

    const response: ShareableLinkResponse = {
      success: true,
      shareableLink: {
        ...shareableLink,
        shareUrl,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error creating shareable link:', error);
    if (error.name === 'AuthenticationError' || error.name === 'AuthorizationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}