'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { UserProfile, ManagedBucket, BucketPermission } from '@/types';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import { 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  UserIcon,
  ShieldCheckIcon,
  FolderIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [buckets, setBuckets] = useState<ManagedBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<string | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivated, setShowDeactivated] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchBuckets();
  }, []);

  const getAuthHeaders = async () => {
    const currentUser = user;
    if (!currentUser) throw new Error('No authenticated user');
    
    // We need to get the Firebase user to get the token
    const { getFirebaseAuth } = await import('@/lib/firebase');
    const firebaseUser = getFirebaseAuth().currentUser;
    if (!firebaseUser) throw new Error('No Firebase user');
    
    const token = await firebaseUser.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/users', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        return data.users; // Return the fresh user data
      } else {
        setError(data.error || 'Failed to fetch users');
        return [];
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedUser = async (userId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/users', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
        // Update selectedUser with fresh data
        const updatedSelectedUser = data.users.find((u: UserProfile) => u.uid === userId);
        if (updatedSelectedUser) {
          setSelectedUser(updatedSelectedUser);
        }
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  const fetchBuckets = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/buckets', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch buckets');
      }
      
      const data = await response.json();
      if (data.success) {
        setBuckets(data.buckets);
      }
    } catch (err) {
      console.error('Error fetching buckets:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId,
          updates: { role: newRole }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      const data = await response.json();
      if (data.success) {
        await fetchUsers(); // Refresh the list
        setError(null);
      } else {
        setError(data.error || 'Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const initiateDeactivate = (userId: string) => {
    setUserToDeactivate(userId);
    setDeactivateConfirmOpen(true);
  };

  const deactivateUser = async () => {
    if (!userToDeactivate) return;
    
    setDeactivateLoading(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/users?userId=${userToDeactivate}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }

      const data = await response.json();
      if (data.success) {
        await fetchUsers(); // Refresh the list
        showSuccess('User deactivated successfully', '');
        setDeactivateConfirmOpen(false);
        setUserToDeactivate(null);
        setError(null);
      } else {
        showError('Failed to deactivate user', data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error deactivating user:', err);
      showError('Failed to deactivate user', 'Please try again');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const grantBucketPermission = async (userId: string, bucketName: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          bucketName,
          permissions: ['read', 'write', 'delete']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grant permission');
      }

      const data = await response.json();
      if (data.success) {
        await refreshSelectedUser(userId); // Refresh user data and update selectedUser
        setError(null);
      } else {
        setError(data.error || 'Failed to grant permission');
      }
    } catch (err) {
      console.error('Error granting permission:', err);
      setError('Failed to grant permission');
    }
  };

  const revokeBucketPermission = async (userId: string, bucketName: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/permissions?userId=${userId}&bucketName=${bucketName}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to revoke permission');
      }

      const data = await response.json();
      if (data.success) {
        // We need the userId context here - get it from the selectedUser
        if (selectedUser) {
          await refreshSelectedUser(selectedUser.uid); // Refresh user data and update selectedUser
        }
        setError(null);
      } else {
        setError(data.error || 'Failed to revoke permission');
      }
    } catch (err) {
      console.error('Error revoking permission:', err);
      setError('Failed to revoke permission');
    }
  };

  const updatePermission = async (userId: string, bucketName: string, permission: 'read' | 'write' | 'delete', grant: boolean) => {
    try {
      const headers = await getAuthHeaders();
      
      if (grant) {
        // Grant specific permission
        const response = await fetch('/api/admin/permissions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId,
            bucketName,
            permissions: [permission]
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to grant permission');
        }

        const data = await response.json();
        if (data.success) {
          await refreshSelectedUser(userId); // Refresh user data and update selectedUser
          setError(null);
        } else {
          setError(data.error || 'Failed to grant permission');
        }
      } else {
        // Revoke specific permission by updating with remaining permissions
        const currentUser = users.find(u => u.uid === userId);
        const currentPermission = currentUser?.permissions?.find(p => p.bucketName === bucketName);
        
        if (currentPermission) {
          const remainingPermissions = currentPermission.permissions.filter(p => p !== permission);
          
          if (remainingPermissions.length === 0) {
            // Revoke all permissions if no permissions left
            await revokeBucketPermission(userId, bucketName);
          } else {
            // Update with remaining permissions
            const response = await fetch('/api/admin/permissions', {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                userId,
                bucketName,
                permissions: remainingPermissions
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to update permission');
            }

            const data = await response.json();
            if (data.success) {
              await refreshSelectedUser(userId); // Refresh user data and update selectedUser
              setError(null);
            } else {
              setError(data.error || 'Failed to update permission');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error updating permission:', err);
      setError('Failed to update permission');
    }
  };

  const grantAllPermissions = async (userId: string, bucketName: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          bucketName,
          permissions: ['read', 'write', 'delete']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grant all permissions');
      }

      const data = await response.json();
      if (data.success) {
        await refreshSelectedUser(userId); // Refresh user data and update selectedUser
        setError(null);
      } else {
        setError(data.error || 'Failed to grant all permissions');
      }
    } catch (err) {
      console.error('Error granting all permissions:', err);
      setError('Failed to grant all permissions');
    }
  };

  const openPermissionModal = (user: UserProfile) => {
    setSelectedUser(user);
    setShowPermissionModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter users based on showDeactivated toggle
  const filteredUsers = showDeactivated 
    ? users 
    : users.filter(user => user.isActive);

  // Calculate user statistics
  const activeUsers = users.filter(user => user.isActive);
  const deactivatedUsers = users.filter(user => !user.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <div className="flex items-center space-x-3">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            Show deactivated users
          </label>
          {showDeactivated ? (
            <EyeIcon className="h-4 w-4 text-gray-400" />
          ) : (
            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-lg font-semibold text-gray-900">{activeUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Deactivated Users</p>
              <p className="text-lg font-semibold text-gray-900">{deactivatedUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-lg font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredUsers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showDeactivated ? 'No users found' : 'No active users found'}
            </h3>
            <p className="text-gray-500">
              {showDeactivated 
                ? 'There are no users in the system.' 
                : 'All users are currently deactivated. Toggle "Show deactivated users" to see them.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((userItem) => (
            <li key={userItem.uid} className={`px-6 py-4 ${!userItem.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {userItem.photoURL ? (
                      <img 
                        className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                        src={userItem.photoURL} 
                        alt={userItem.displayName || userItem.email}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ${userItem.photoURL ? 'hidden' : 'flex'}`}
                      style={{ display: userItem.photoURL ? 'none' : 'flex' }}
                    >
                      <span className="text-sm font-medium text-white">
                        {(userItem.displayName || userItem.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className={`text-sm font-medium ${!userItem.isActive ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {userItem.displayName || userItem.email}
                      </p>
                      {userItem.role === 'admin' && (
                        <ShieldCheckIcon className="ml-2 h-4 w-4 text-indigo-600" />
                      )}
                      {!userItem.isActive && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{userItem.email}</p>
                    <p className="text-xs text-gray-400">
                      {userItem.bucketPermissions.length} bucket{userItem.bucketPermissions.length !== 1 ? 's' : ''} accessible
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={userItem.role}
                    onChange={(e) => updateUserRole(userItem.uid, e.target.value as 'admin' | 'user')}
                    disabled={userItem.uid === user?.uid || !userItem.isActive}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => openPermissionModal(userItem)}
                    disabled={!userItem.isActive}
                    className={`p-2 ${!userItem.isActive ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                    title={!userItem.isActive ? 'Cannot manage permissions for deactivated user' : 'Manage bucket permissions'}
                  >
                    <FolderIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => initiateDeactivate(userItem.uid)}
                    disabled={userItem.uid === user?.uid || !userItem.isActive}
                    className={`p-2 ${(userItem.uid === user?.uid || !userItem.isActive) ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
                    title={!userItem.isActive ? 'User already deactivated' : userItem.uid === user?.uid ? 'Cannot deactivate yourself' : 'Deactivate user'}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
            ))}
          </ul>
        )}
      </div>

      {/* Permission Management Modal */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-5/6 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Manage Bucket Permissions
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedUser.displayName || selectedUser.email} • {selectedUser.email}
                  </p>
                </div>
                <div className="flex items-center">
                  {selectedUser.photoURL ? (
                    <img 
                      className="h-10 w-10 rounded-full object-cover border border-gray-200 mr-3" 
                      src={selectedUser.photoURL} 
                      alt={selectedUser.displayName || selectedUser.email}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 ${selectedUser.photoURL ? 'hidden' : 'flex'}`}
                    style={{ display: selectedUser.photoURL ? 'none' : 'flex' }}
                  >
                    <span className="text-sm font-medium text-white">
                      {(selectedUser.displayName || selectedUser.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {selectedUser.role === 'admin' && (
                    <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                  )}
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bucket
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Read
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Write
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delete
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {buckets.map((bucket) => {
                      const userPermission = selectedUser.permissions?.find(p => p.bucketName === bucket.name);
                      const hasRead = userPermission?.permissions.includes('read') || false;
                      const hasWrite = userPermission?.permissions.includes('write') || false;
                      const hasDelete = userPermission?.permissions.includes('delete') || false;
                      const hasAnyPermission = hasRead || hasWrite || hasDelete;

                      return (
                        <tr key={bucket.name} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{bucket.displayName}</div>
                              <div className="text-sm text-gray-500">{bucket.name}</div>
                              <div className="text-xs text-gray-400">{bucket.location} • {bucket.storageClass}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={hasRead}
                              onChange={(e) => updatePermission(selectedUser.uid, bucket.name, 'read', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={hasWrite}
                              onChange={(e) => updatePermission(selectedUser.uid, bucket.name, 'write', e.target.checked)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={hasDelete}
                              onChange={(e) => updatePermission(selectedUser.uid, bucket.name, 'delete', e.target.checked)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => grantAllPermissions(selectedUser.uid, bucket.name)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                Grant All
                              </button>
                              {hasAnyPermission && (
                                <button
                                  onClick={() => revokeBucketPermission(selectedUser.uid, bucket.name)}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Revoke All
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-600">
                  <strong>Legend:</strong>
                  <span className="ml-2">Read = View files</span>
                  <span className="ml-3">Write = Upload files</span>
                  <span className="ml-3">Delete = Remove files</span>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setShowPermissionModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmationModal
        isOpen={deactivateConfirmOpen}
        onClose={() => {
          setDeactivateConfirmOpen(false);
          setUserToDeactivate(null);
        }}
        onConfirm={deactivateUser}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user? This will remove their access to all buckets and they will no longer be able to use the system."
        confirmText="Deactivate"
        cancelText="Cancel"
        type="danger"
        isLoading={deactivateLoading}
      />
    </div>
  );
};

export default UserManagement;