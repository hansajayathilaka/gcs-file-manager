'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ManagedBucket, AdminBucketCreateRequest, DiscoverableBucket, BucketImportRequest } from '@/types';
import { 
  PlusIcon,
  FolderIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const BucketManagement: React.FC = () => {
  const { user } = useAuth();
  const [buckets, setBuckets] = useState<ManagedBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableBuckets, setAvailableBuckets] = useState<DiscoverableBucket[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<Set<string>>(new Set());
  const [newBucket, setNewBucket] = useState<AdminBucketCreateRequest>({
    name: '',
    displayName: '',
    location: 'asia-southeast1',
    storageClass: 'STANDARD',
    description: '',
  });

  useEffect(() => {
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
      } else {
        setError(data.error || 'Failed to fetch buckets');
      }
    } catch (err) {
      console.error('Error fetching buckets:', err);
      setError('Failed to fetch buckets');
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async () => {
    if (!newBucket.name || !newBucket.displayName) {
      setError('Name and display name are required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/buckets', {
        method: 'POST',
        headers,
        body: JSON.stringify(newBucket),
      });

      if (!response.ok) {
        throw new Error('Failed to create bucket');
      }

      const data = await response.json();
      if (data.success) {
        await fetchBuckets(); // Refresh the list
        setShowCreateModal(false);
        setNewBucket({
          name: '',
          displayName: '',
          location: 'asia-southeast1',
          storageClass: 'STANDARD',
          description: '',
        });
      } else {
        setError(data.error || 'Failed to create bucket');
      }
    } catch (err) {
      console.error('Error creating bucket:', err);
      setError('Failed to create bucket');
    } finally {
      setCreating(false);
    }
  };

  const discoverBuckets = async () => {
    setDiscovering(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/buckets/import', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to discover buckets');
      }

      const data = await response.json();
      if (data.success) {
        setAvailableBuckets(data.availableBuckets || []);
        setSelectedBuckets(new Set());
      } else {
        setError(data.error || 'Failed to discover buckets');
      }
    } catch (err) {
      console.error('Error discovering buckets:', err);
      setError('Failed to discover buckets');
    } finally {
      setDiscovering(false);
    }
  };

  const importBuckets = async () => {
    if (selectedBuckets.size === 0) {
      setError('Please select at least one bucket to import');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const bucketsToImport = Array.from(selectedBuckets).map(bucketName => {
        const bucket = availableBuckets.find(b => b.name === bucketName);
        return {
          name: bucketName,
          displayName: bucket?.name || bucketName,
          description: `Imported GCS bucket (${bucket?.storageClass}, ${bucket?.location})`,
        };
      });

      const importRequest: BucketImportRequest = {
        buckets: bucketsToImport,
      };

      const response = await fetch('/api/admin/buckets/import', {
        method: 'POST',
        headers,
        body: JSON.stringify(importRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to import buckets');
      }

      const data = await response.json();
      if (data.success) {
        await fetchBuckets(); // Refresh the list
        setShowImportModal(false);
        setSelectedBuckets(new Set());
        setAvailableBuckets([]);
        
        // Show import results
        const { summary, results } = data;
        if (summary) {
          const message = `Successfully imported ${summary.successful} of ${summary.total} buckets`;
          if (summary.failed > 0) {
            const failedBuckets = results?.filter((r: any) => !r.success).map((r: any) => r.name).join(', ');
            setError(`${message}. Failed: ${failedBuckets}`);
          }
        }
      } else {
        setError(data.error || 'Failed to import buckets');
      }
    } catch (err) {
      console.error('Error importing buckets:', err);
      setError('Failed to import buckets');
    } finally {
      setImporting(false);
    }
  };

  const toggleBucketSelection = (bucketName: string) => {
    const newSelection = new Set(selectedBuckets);
    if (newSelection.has(bucketName)) {
      newSelection.delete(bucketName);
    } else {
      newSelection.add(bucketName);
    }
    setSelectedBuckets(newSelection);
  };

  const selectAllBuckets = () => {
    setSelectedBuckets(new Set(availableBuckets.map(b => b.name)));
  };

  const clearSelection = () => {
    setSelectedBuckets(new Set());
  };

  const validateBucketName = (name: string) => {
    const bucketNameRegex = /^[a-z0-9]([a-z0-9-._])*[a-z0-9]$/;
    return bucketNameRegex.test(name) && name.length >= 3 && name.length <= 63;
  };

  const handleNameChange = (value: string) => {
    setNewBucket(prev => ({
      ...prev,
      name: value.toLowerCase().replace(/[^a-z0-9-._]/g, '')
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Bucket Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowImportModal(true);
              discoverBuckets();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Import Buckets
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Bucket
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Buckets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buckets.map((bucket) => (
          <div key={bucket.name} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FolderIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{bucket.displayName}</h3>
                <p className="text-sm text-gray-500">{bucket.name}</p>
              </div>
            </div>
            
            {bucket.description && (
              <p className="text-sm text-gray-600 mb-4">{bucket.description}</p>
            )}
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                {bucket.location} • {bucket.storageClass}
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Created {new Date(bucket.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2" />
                {bucket.allowedUsers.length} user{bucket.allowedUsers.length !== 1 ? 's' : ''} have access
              </div>
            </div>
          </div>
        ))}
      </div>

      {buckets.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No buckets</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new bucket.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Bucket
            </button>
          </div>
        </div>
      )}

      {/* Create Bucket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Bucket</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bucket Name *
                  </label>
                  <input
                    type="text"
                    value={newBucket.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="my-bucket-name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {newBucket.name && !validateBucketName(newBucket.name) && (
                    <p className="text-xs text-red-600 mt-1">
                      Must be 3-63 characters, lowercase letters, numbers, hyphens, and periods only
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={newBucket.displayName}
                    onChange={(e) => setNewBucket(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="My Bucket"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    value={newBucket.location}
                    onChange={(e) => setNewBucket(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <optgroup label="Asia Pacific">
                      <option value="asia-southeast1">Asia Southeast (Singapore)</option>
                      <option value="asia-southeast2">Asia Southeast (Jakarta)</option>
                      <option value="asia-east1">Asia East (Taiwan)</option>
                      <option value="asia-east2">Asia East (Hong Kong)</option>
                      <option value="asia-northeast1">Asia Northeast (Tokyo)</option>
                      <option value="asia-northeast2">Asia Northeast (Osaka)</option>
                      <option value="asia-northeast3">Asia Northeast (Seoul)</option>
                      <option value="asia-south1">Asia South (Mumbai)</option>
                      <option value="asia-south2">Asia South (Delhi)</option>
                      <option value="australia-southeast1">Australia Southeast (Sydney)</option>
                      <option value="australia-southeast2">Australia Southeast (Melbourne)</option>
                    </optgroup>
                    <optgroup label="Europe">
                      <option value="europe-west1">Europe West (Belgium)</option>
                      <option value="europe-west2">Europe West (London)</option>
                      <option value="europe-west3">Europe West (Frankfurt)</option>
                      <option value="europe-west4">Europe West (Netherlands)</option>
                      <option value="europe-west6">Europe West (Zurich)</option>
                      <option value="europe-west8">Europe West (Milan)</option>
                      <option value="europe-west9">Europe West (Paris)</option>
                      <option value="europe-central2">Europe Central (Warsaw)</option>
                      <option value="europe-north1">Europe North (Finland)</option>
                      <option value="europe-southwest1">Europe Southwest (Madrid)</option>
                    </optgroup>
                    <optgroup label="North America">
                      <option value="us-central1">US Central (Iowa)</option>
                      <option value="us-east1">US East (South Carolina)</option>
                      <option value="us-east4">US East (Northern Virginia)</option>
                      <option value="us-east5">US East (Columbus)</option>
                      <option value="us-south1">US South (Dallas)</option>
                      <option value="us-west1">US West (Oregon)</option>
                      <option value="us-west2">US West (Los Angeles)</option>
                      <option value="us-west3">US West (Salt Lake City)</option>
                      <option value="us-west4">US West (Las Vegas)</option>
                      <option value="northamerica-northeast1">Canada Central (Montreal)</option>
                      <option value="northamerica-northeast2">Canada Central (Toronto)</option>
                    </optgroup>
                    <optgroup label="South America">
                      <option value="southamerica-east1">South America East (São Paulo)</option>
                      <option value="southamerica-west1">South America West (Santiago)</option>
                    </optgroup>
                    <optgroup label="Middle East">
                      <option value="me-west1">Middle East West (Tel Aviv)</option>
                      <option value="me-central1">Middle East Central (Doha)</option>
                    </optgroup>
                    <optgroup label="Africa">
                      <option value="africa-south1">Africa South (Johannesburg)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Class
                  </label>
                  <select
                    value={newBucket.storageClass}
                    onChange={(e) => setNewBucket(prev => ({ ...prev, storageClass: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="NEARLINE">Nearline</option>
                    <option value="COLDLINE">Coldline</option>
                    <option value="ARCHIVE">Archive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newBucket.description}
                    onChange={(e) => setNewBucket(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createBucket}
                  disabled={creating || !newBucket.name || !newBucket.displayName || !validateBucketName(newBucket.name)}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {creating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {creating ? 'Creating...' : 'Create Bucket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Buckets Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Existing Buckets</h3>
              
              {discovering ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2">Discovering buckets...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableBuckets.length === 0 ? (
                    <div className="text-center py-8">
                      <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h4 className="mt-2 text-lg font-medium text-gray-900">No buckets available for import</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        All existing GCS buckets are already managed in the system.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          Found {availableBuckets.length} bucket(s) available for import:
                        </p>
                        <div className="space-x-2">
                          <button
                            onClick={selectAllBuckets}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            Select All
                          </button>
                          <button
                            onClick={clearSelection}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Select
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Bucket Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Storage Class
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {availableBuckets.map((bucket) => (
                              <tr key={bucket.name} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedBuckets.has(bucket.name)}
                                    onChange={() => toggleBucketSelection(bucket.name)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{bucket.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{bucket.location}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {bucket.storageClass}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(bucket.created).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {selectedBuckets.size > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <p className="text-sm text-blue-700">
                            <strong>{selectedBuckets.size}</strong> bucket(s) selected for import.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-6 space-x-2">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedBuckets(new Set());
                    setAvailableBuckets([]);
                    setError(null);
                  }}
                  disabled={importing}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                {availableBuckets.length > 0 && (
                  <button
                    onClick={importBuckets}
                    disabled={importing || selectedBuckets.size === 0}
                    className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    {importing && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {importing ? 'Importing...' : `Import ${selectedBuckets.size} Bucket(s)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BucketManagement;