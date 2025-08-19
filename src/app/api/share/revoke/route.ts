import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getShareableLinkById, revokeShareableLink, isUserAdmin } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const { linkId } = await request.json();

    if (!linkId) {
      return NextResponse.json(
        { success: false, error: 'Missing linkId' },
        { status: 400 }
      );
    }

    // Get the shareable link
    const link = await getShareableLinkById(linkId);
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    // Check if user owns the link or is admin
    const isAdmin = await isUserAdmin(user.uid);
    if (link.createdBy !== user.uid && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to revoke this link' },
        { status: 403 }
      );
    }

    // Check if link is already revoked
    if (link.isRevoked) {
      return NextResponse.json(
        { success: false, error: 'Link is already revoked' },
        { status: 400 }
      );
    }

    // Revoke the link
    await revokeShareableLink(linkId, user.uid);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error revoking shareable link:', error);
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