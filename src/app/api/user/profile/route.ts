import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, updateUserProfile, getAllUserPermissions, createUserProfile } from '@/lib/database';
import { adminAuth } from '@/lib/firebase-admin';

// GET - Get current user profile
export async function GET(request: NextRequest) {
  try {
    // Verify authentication without requiring existing profile first
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (tokenError) {
      return NextResponse.json(
        { success: false, error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    // Get fresh profile data
    let profile = await getUserProfile(decodedToken.uid);
    
    // If profile doesn't exist, create it automatically
    if (!profile) {
      profile = await createUserProfile({
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || undefined,
        photoURL: decodedToken.picture || undefined,
        role: 'user',
      });
    }

    // Get user's permissions
    const permissions = await getAllUserPermissions(decodedToken.uid);

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        permissions,
      },
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile (limited fields for regular users)
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (tokenError) {
      return NextResponse.json(
        { success: false, error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    
    // Only allow users to update certain fields
    const allowedFields = ['displayName', 'photoURL'];
    const sanitizedUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    // Users cannot change their own role or bucket permissions
    if (updates.role || updates.bucketPermissions) {
      return NextResponse.json(
        { success: false, error: 'You cannot modify role or bucket permissions' },
        { status: 403 }
      );
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await updateUserProfile(decodedToken.uid, sanitizedUpdates);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}