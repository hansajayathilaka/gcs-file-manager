'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAllowedBuckets } from '@/hooks/useAllowedBuckets';
import LoginForm from '@/components/LoginForm';
import FileManagerV2 from '@/components/FileManagerV2';

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { allowedBuckets, loading: bucketsLoading, error: bucketsError } = useAllowedBuckets();
  const [isSignUp, setIsSignUp] = useState(false);

  if (authLoading || bucketsLoading) {
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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GCS File Manager</h1>
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
      <main className="h-[calc(100vh-80px)] overflow-hidden">
        {bucketsError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading buckets
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{bucketsError}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {allowedBuckets.length === 0 && !bucketsError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 m-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No buckets configured
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Please configure the ALLOWED_BUCKETS environment variable with comma-separated bucket names.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {allowedBuckets.length > 0 && (
          <div className="h-full">
            <FileManagerV2 allowedBuckets={allowedBuckets} />
          </div>
        )}
      </main>
    </div>
  );
}
