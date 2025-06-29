'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import BucketConfig from '@/components/BucketConfig';
import FileManager from '@/components/FileManager';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [allowedBuckets, setAllowedBuckets] = useState<string[]>([
    // Default buckets - these can be configured via environment variables in production
    'my-sample-bucket-1',
    'my-sample-bucket-2'
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginForm
        onToggleMode={() => setIsSignUp(!isSignUp)}
        isSignUp={isSignUp}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GCS File Manager</h1>
              <p className="text-sm text-gray-600">Welcome, {user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <BucketConfig
            allowedBuckets={allowedBuckets}
            onBucketsUpdate={setAllowedBuckets}
          />
          <FileManager allowedBuckets={allowedBuckets} />
        </div>
      </main>
    </div>
  );
}
