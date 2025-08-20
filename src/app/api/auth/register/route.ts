import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/database';
import { UserRegistrationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const registrationData: UserRegistrationRequest = await request.json();
    const { email, password, displayName } = registrationData;
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      const firebaseUser = userCredential.user;

      // Create user profile in database
      const userProfile = await createUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        role: 'user', // New users start as regular users, not admin
      });

      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        user: {
          uid: userProfile.uid,
          email: userProfile.email,
          displayName: userProfile.displayName,
          role: userProfile.role,
        },
      });
    } catch (firebaseError: any) {
      console.error('Firebase registration error:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists' },
          { status: 409 }
        );
      } else if (firebaseError.code === 'auth/weak-password') {
        return NextResponse.json(
          { success: false, error: 'Password is too weak. Please choose a stronger password.' },
          { status: 400 }
        );
      } else if (firebaseError.code === 'auth/invalid-email') {
        return NextResponse.json(
          { success: false, error: 'Invalid email address' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: 'Registration failed. Please try again.' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error in user registration:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}