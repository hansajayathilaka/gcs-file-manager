import { NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/runtime-config';

// API endpoint to provide public configuration to client
// This follows Next.js best practices for runtime environment variables
export async function GET() {
  try {
    const config = getServerConfig();
    
    // Only return public configuration that's safe for the client
    const publicConfig = {
      firebase: {
        // These values should be safe to expose to the client
        // Consider getting them from a secure source or environment
        apiKey: process.env.FIREBASE_API_KEY, // This should be safe to expose
        authDomain: `${config.firebase.projectId}.firebaseapp.com`,
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
      },
      domain: config.server.publicDomain,
    };

    return NextResponse.json(publicConfig);
  } catch (error) {
    console.error('Error fetching public config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}