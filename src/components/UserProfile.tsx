'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BucketPermission } from '@/types';
import Navigation from '@/components/shared/Navigation';
import Link from 'next/link';
import { 
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  FolderIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const UserProfile: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const [permissions, setPermissions] = useState<BucketPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      fetchUserPermissions();
    }
  }, [userProfile]);

  const getAuthHeaders = async () => {
    const currentUser = user;
    if (!currentUser) throw new Error('No authenticated user');
    
    // We need to get the Firebase user to get the token
    const { auth } = await import('@/lib/firebase');
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('No Firebase user');
    
    const token = await firebaseUser.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchUserPermissions = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/user/profile', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      if (data.success && data.profile.permissions) {
        setPermissions(data.profile.permissions);
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError('Failed to fetch profile information');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          displayName: displayName.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      if (data.success) {
        await refreshProfile();
        setEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setDisplayName(userProfile?.displayName || '');
    setEditing(false);
    setError(null);
  };

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        title="Profile Settings"
        showBackButton={true}
        backButtonText="File Manager"
        backButtonHref="/"
        showUserActions={true}
      />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {userProfile.photoURL ? (
                <img 
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName || userProfile.email}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-gray-200 ${userProfile.photoURL ? 'hidden' : 'flex'}`}
                style={{ display: userProfile.photoURL ? 'none' : 'flex' }}
              >
                <span className="text-xl font-medium text-white">
                  {(userProfile.displayName || userProfile.email).charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-6">
              <div className="flex items-center space-x-3">
                {editing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    className="text-2xl font-bold text-gray-900 border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">
                    {userProfile.displayName || 'No display name set'}
                  </h1>
                )}
                
                <div className="flex items-center space-x-2">
                  {userProfile.role === 'admin' && (
                    <div className="flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                      Admin
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-2 flex items-center text-gray-600">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                {userProfile.email}
              </div>
              
              <div className="mt-1 flex items-center text-gray-500 text-sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Member since {new Date(userProfile.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className="flex items-center px-3 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckIcon className="h-4 w-4 mr-2" />
                  )}
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center px-3 py-2 text-sm text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Bucket Permissions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Bucket Access</h2>
        
        {userProfile.role === 'admin' ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-indigo-800 font-medium">Admin Access</span>
            </div>
            <p className="text-indigo-700 text-sm mt-1">
              As an administrator, you have full access to all buckets and can manage users and permissions.
            </p>
            <Link 
              href="/admin" 
              className="inline-block mt-3 text-indigo-600 hover:text-indigo-800 text-sm underline"
            >
              Go to Admin Dashboard →
            </Link>
          </div>
        ) : userProfile.bucketPermissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProfile.bucketPermissions.map((bucketName) => {
              const permission = permissions.find(p => p.bucketName === bucketName);
              return (
                <div key={bucketName} className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FolderIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="font-medium text-gray-900">{bucketName}</span>
                  </div>
                  
                  {permission && (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {permission.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Granted {new Date(permission.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bucket access</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don&apos;t have access to any buckets yet. Contact your administrator to request access.
            </p>
          </div>
        )}
      </div>
      </main>
    </div>
  );
};

export default UserProfile;