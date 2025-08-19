'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileOperationsProvider } from '@/contexts/FileOperationsContext';
import { useAllowedBuckets } from '@/hooks/useAllowedBuckets';
import { useRouter } from 'next/navigation';
import FileManagerV2 from '@/components/FileManagerV2';
import Navigation from '@/components/shared/Navigation';
import Link from 'next/link';

export default function Home() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const { allowedBuckets, loading: bucketsLoading, error: bucketsError } = useAllowedBuckets();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || bucketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        title="GCS File Manager" 
        showUserActions={true}
      />

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
                  {userProfile?.role !== 'admin' && (
                    <p className="mt-1">Contact your administrator for bucket access.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {allowedBuckets.length === 0 && !bucketsError && userProfile && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 m-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No bucket access
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {userProfile.role === 'admin' ? (
                    <div>
                      <p>No buckets are currently configured.</p>
                      <Link 
                        href="/admin" 
                        className="inline-block mt-2 text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Go to Admin Dashboard to create buckets →
                      </Link>
                    </div>
                  ) : (
                    <p>You don&apos;t have access to any buckets. Contact your administrator to request access.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {allowedBuckets.length > 0 && (
          <div className="h-full">
            <FileOperationsProvider>
              <FileManagerV2 allowedBuckets={allowedBuckets} />
            </FileOperationsProvider>
          </div>
        )}
      </main>
    </div>
  );
}