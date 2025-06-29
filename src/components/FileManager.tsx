'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { GCSFile } from '@/types';

interface FileManagerProps {
  allowedBuckets: string[];
}

export default function FileManager({ allowedBuckets }: FileManagerProps) {
  const { user } = useAuth();
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [files, setFiles] = useState<GCSFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) return {};
    
    try {
      // Get the current user's ID token from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) return {};
      
      const token = await currentUser.getIdToken();
      return {
        'Authorization': `Bearer ${token}`,
      };
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {};
    }
  }, [user]);

  const loadFiles = useCallback(async (bucketName: string) => {
    if (!bucketName) return;
    
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/buckets?bucket=${bucketName}`, {
        headers,
      });
      
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      } else {
        console.error('Failed to load files:', data.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedBucket) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bucket', selectedBucket);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers,
      });

      const data = await response.json();
      if (data.success) {
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Reload files
        loadFiles(selectedBucket);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileName: string) => {
    if (!selectedBucket || !confirm('Are you sure you want to delete this file?')) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/delete?bucket=${selectedBucket}&file=${fileName}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      if (data.success) {
        // Reload files
        loadFiles(selectedBucket);
      } else {
        console.error('Delete failed:', data.error);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    if (selectedBucket) {
      loadFiles(selectedBucket);
    }
  }, [selectedBucket, loadFiles]);

  return (
    <div className="space-y-6">
      {/* Bucket Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Bucket</h2>
        <select
          value={selectedBucket}
          onChange={(e) => setSelectedBucket(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">Choose a bucket...</option>
          {allowedBuckets.map((bucket) => (
            <option key={bucket} value={bucket}>
              {bucket}
            </option>
          ))}
        </select>
      </div>

      {selectedBucket && (
        <>
          {/* File Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload File</h3>
            <div className="space-y-4">
              <div>
                <input
                  id="fileInput"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-900">{selectedFile.name}</span>
                  <button
                    onClick={handleFileUpload}
                    disabled={uploading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* File List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Files in {selectedBucket}
              </h3>
            </div>
            <div className="overflow-hidden">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading files...</div>
              ) : files.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No files found in this bucket</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Modified
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {files.map((file) => (
                        <tr key={file.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {file.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(file.updated)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleFileDelete(file.name)}
                              className="text-red-600 hover:text-red-500"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
