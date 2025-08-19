import { NextRequest, NextResponse } from 'next/server';
import { getShareableLink } from '@/lib/database';

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

    // Get the shareable link (without incrementing access count)
    const link = await getShareableLink(token);
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      link,
    });
  } catch (error) {
    console.error('Error getting link info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}