import { NextRequest, NextResponse } from 'next/server';
import { getAllowedBuckets } from '@/lib/gcs';
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

    // Get allowed buckets from environment variable
    const allowedBuckets = getAllowedBuckets();

    return NextResponse.json({
      success: true,
      buckets: allowedBuckets,
    });
  } catch (error) {
    console.error('Error getting allowed buckets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get allowed buckets' },
      { status: 500 }
    );
  }
}
