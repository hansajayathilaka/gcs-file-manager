import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getUserBuckets } from '@/lib/database';

// GET - Get buckets accessible to the current user
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Admins can see all buckets, regular users only see their assigned buckets
    let userBuckets: string[];
    
    if (user.profile.role === 'admin') {
      // For admin users, get all managed buckets from database
      const { getAllManagedBuckets } = await import('@/lib/database');
      const managedBuckets = await getAllManagedBuckets();
      userBuckets = managedBuckets.map(bucket => bucket.name);
    } else {
      // For regular users, get their assigned buckets
      userBuckets = await getUserBuckets(user.uid);
    }

    return NextResponse.json({
      success: true,
      buckets: userBuckets,
      userRole: user.profile.role,
    });
  } catch (error) {
    console.error('Error getting user buckets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user buckets' },
      { status: 500 }
    );
  }
});
