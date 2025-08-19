import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-middleware';
import { getUserShareableLinks } from '@/lib/database';
import { ShareableLinkListResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    // Get user's shareable links
    const links = await getUserShareableLinks(user.uid);

    const response: ShareableLinkListResponse = {
      success: true,
      links,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting shareable links:', error);
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