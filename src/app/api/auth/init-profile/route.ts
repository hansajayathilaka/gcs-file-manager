import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, createUserProfile } from '@/lib/database';
import { getFirebaseAdminAuth } from '@/lib/firebase-admin';

// POST - Initialize user profile if it doesn't exist
export async function POST(request: NextRequest) {
  try {
    // Verify authentication without requiring existing profile
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
      decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    } catch (tokenError) {
      return NextResponse.json(
        { success: false, error: 'Invalid authorization token' },
        { status: 401 }
      );
    }
    
    // Check if profile already exists
    let profile = await getUserProfile(decodedToken.uid);
    
    if (!profile) {
      // Create new profile with Firebase token info
      profile = await createUserProfile({
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || undefined,
        photoURL: decodedToken.picture || undefined,
        role: 'user',
      });
    }

    return NextResponse.json({
      success: true,
      profile,
      message: profile ? 'Profile initialized successfully' : 'Profile already exists',
    });
  } catch (error) {
    console.error('Error initializing user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize profile' },
      { status: 500 }
    );
  }
}