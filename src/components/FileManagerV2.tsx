'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import BucketSidebar from '@/components/BucketSidebar';
import Breadcrumb from '@/components/Breadcrumb';
import FileBrowser from '@/components/FileBrowser';
import FilePreview from '@/components/FilePreview';
import { FileTreeItem, BreadcrumbItem, FolderOption } from '@/types/fileSystem';

interface FileManagerV2Props {
  allowedBuckets: string[];
}

export default function FileManagerV2({ allowedBuckets }: FileManagerV2Props) {
  const { user } = useAuth();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allFolders, setAllFolders] = useState<FolderOption[]>([]);
  const [previewFile, setPreviewFile] = useState<FileTreeItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) return {};
    
    try {
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

  const loadFiles = useCallback(async (bucketName: string, prefix: string = '') => {
    if (!bucketName) return;
    
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const url = new URL('/api/buckets', window.location.origin);
      url.searchParams.append('bucket', bucketName);
      if (prefix) {
        url.searchParams.append('prefix', prefix);
      }

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();
      
      if (data.success) {
        const transformedFiles: FileTreeItem[] = data.files.map((file: any) => ({
          name: file.name,
          path: file.path,
          isFolder: file.isFolder,
          size: file.size,
          modified: file.updated,
          contentType: file.contentType,
          originalName: file.originalName,
          storedPath: file.storedPath,
        }));
        setFiles(transformedFiles);
        setCurrentPath(prefix);
      } else {
        console.error('Failed to load files:', data.error);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const loadAllFolders = useCallback(async (bucketName: string) => {
    try {
      const headers = await getAuthHeaders();
      
      // Get all objects in the bucket to build complete folder structure
      const url = new URL('/api/buckets', window.location.origin);
      url.searchParams.append('bucket', bucketName);
      url.searchParams.append('getAllFolders', 'true');
      
      const response = await fetch(url.toString(), { headers });
      const data = await response.json();
      
      if (data.success && data.files) {
        // Build a complete folder tree
        const folderSet = new Set<string>();
        
        // Add all folders from the response
        data.files.filter((f: any) => f.isFolder).forEach((folder: any) => {
          folderSet.add(folder.path);
        });
        
        // Add parent paths for nested folders
        data.files.forEach((file: any) => {
          if (!file.isFolder && file.path.includes('/')) {
            const pathParts = file.path.split('/');
            for (let i = 1; i < pathParts.length; i++) {
              const folderPath = pathParts.slice(0, i).join('/') + '/';
              folderSet.add(folderPath);
            }
          }
        });
        
        // Convert to folder options with proper hierarchy
        const folderOptions: FolderOption[] = Array.from(folderSet)
          .sort()
          .map(folderPath => {
            const cleanPath = folderPath.replace(/\/$/, ''); // Remove trailing slash
            const pathParts = cleanPath.split('/').filter(p => p);
            const level = pathParts.length - 1;
            const name = pathParts[pathParts.length - 1] || 'Root';
            
            return {
              name: name,
              path: cleanPath,
              level: level
            };
          })
          .filter(folder => folder.name !== 'Root'); // Remove empty root
        
        setAllFolders(folderOptions);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      setAllFolders([]);
    }
  }, [getAuthHeaders]);

  const handleBucketSelect = (bucket: string) => {
    setSelectedBucket(bucket);
    setCurrentPath('');
    loadFiles(bucket, '');
    loadAllFolders(bucket); // Load folders when a bucket is selected
  };

  const handleNavigate = (path: string) => {
    if (selectedBucket) {
      loadFiles(selectedBucket, path);
    }
  };

  const handleUpload = async (files: File[] | FileList, destinationPath: string = '') => {
    if (!selectedBucket) return;

    const filesArray = Array.isArray(files) ? files : Array.from(files);
    
    console.log('Upload starting:', { 
      fileCount: filesArray.length,
      destinationPath, 
      currentPath,
      destinationPathLength: destinationPath.length 
    });

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('bucket', selectedBucket);
      formData.append('currentPath', destinationPath);
      
      // Add each file to the form data with its relative path (if any)
      filesArray.forEach((file, index) => {
        formData.append(`file-${index}`, file);
        
        // Check if the file has a webkitRelativePath (folder upload)
        const relativePath = (file as any).webkitRelativePath || '';
        formData.append(`path-${index}`, relativePath);
      });
      
      // Debug the form data
      console.log('FormData contents:', {
        fileCount: filesArray.length,
        bucket: selectedBucket,
        currentPath: destinationPath,
        firstFile: filesArray[0]?.name,
        hasRelativePaths: filesArray.some(f => (f as any).webkitRelativePath)
      });

      const headers = await getAuthHeaders();
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers,
      });

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data.success) {
        // Reload folders structure since we might have uploaded to a new location
        loadAllFolders(selectedBucket);
        
        // If uploaded to current path, reload current view
        // If uploaded to different path, show success message
        if (destinationPath === currentPath) {
          console.log('Uploaded to current path, reloading current view');
          loadFiles(selectedBucket, currentPath);
        } else {
          // Show success message and optionally navigate to the upload location
          console.log('Uploaded to different path:', destinationPath);
          alert(`${data.successCount} file${data.successCount !== 1 ? 's' : ''} uploaded successfully to: ${destinationPath || 'root'}`);
          loadFiles(selectedBucket, currentPath); // Still refresh current view in case of .keep files etc.
        }
      } else {
        console.error('Upload failed:', data.error);
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    if (!selectedBucket) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          bucket: selectedBucket,
          folderName,
          currentPath,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload files to show the new folder
        loadFiles(selectedBucket, currentPath);
      } else {
        console.error('Create folder failed:', data.error);
        alert('Create folder failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Create folder failed');
    }
  };

  const handleDelete = async (fileName: string, isFolder: boolean = false): Promise<void> => {
    const confirmMessage = isFolder 
      ? `Are you sure you want to delete the folder "${fileName}" and all its contents? This action cannot be undone.`
      : `Are you sure you want to delete the file "${fileName}"?`;
      
    if (!selectedBucket || !confirm(confirmMessage)) return;

    try {
      const headers = await getAuthHeaders();
      // Find the file item to get the stored path
      const fileItem = files.find(f => f.name === fileName);
      const fullPath = fileItem?.storedPath || (currentPath + fileName);
      
      const url = new URL('/api/delete', window.location.origin);
      url.searchParams.append('bucket', selectedBucket);
      url.searchParams.append('file', fullPath);
      url.searchParams.append('isFolder', isFolder.toString());
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      if (data.success) {
        // Reload files to reflect the deletion
        loadFiles(selectedBucket, currentPath);
      } else {
        console.error('Delete failed:', data.error);
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  const handleDownload = async (item: FileTreeItem) => {
    if (!selectedBucket) return;

    try {
      const headers = await getAuthHeaders();
      // Use the stored path for the actual download, not the display name
      const filePath = item.storedPath || item.path;
      const url = new URL('/api/download', window.location.origin);
      url.searchParams.append('bucket', selectedBucket);
      url.searchParams.append('file', filePath);

      const response = await fetch(url.toString(), {
        headers,
      });

      if (response.ok) {
        // Create a blob from the response and trigger download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = item.originalName || item.name; // Use original name for download
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        console.error('Download failed:', errorData.error);
        alert('Download failed: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Download failed');
    }
  };

  const handleBulkDownload = async (items: FileTreeItem[]) => {
    if (!selectedBucket || items.length === 0) return;

    try {
      const headers = await getAuthHeaders();
      
      // Prepare the request body with file paths
      const filePaths = items.map(item => item.storedPath || item.path);
      
      const response = await fetch('/api/download-bulk', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: selectedBucket,
          files: filePaths,
        }),
      });

      if (response.ok) {
        // Create a blob from the response and trigger download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        // Get filename from response headers or use default
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'download.zip';
        if (disposition) {
          const filenameMatch = disposition.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        console.error('Bulk download failed:', errorData.error);
        alert('Bulk download failed: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error downloading files:', error);
      alert('Bulk download failed');
    }
  };

  const handleFilePreview = (file: FileTreeItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  // Generate breadcrumb items
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (!currentPath) return [];

    const pathParts = currentPath.split('/').filter(part => part.length > 0);
    const items: BreadcrumbItem[] = [];
    
    for (let i = 0; i < pathParts.length; i++) {
      const path = pathParts.slice(0, i + 1).join('/') + '/';
      items.push({
        name: pathParts[i],
        path,
      });
    }

    return items;
  };
  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <BucketSidebar
        buckets={allowedBuckets}
        selectedBucket={selectedBucket}
        onBucketSelect={handleBucketSelect}
        loading={false}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {selectedBucket ? (
          <>
            {/* Header with Breadcrumb */}
            <div className="bg-white border-b border-gray-200 p-4">
              <Breadcrumb
                items={getBreadcrumbItems()}
                onNavigate={handleNavigate}
                bucket={selectedBucket}
              />
            </div>

            {/* File Browser */}
            <FileBrowser
              files={files}
              currentPath={currentPath}
              bucket={selectedBucket}
              loading={loading}
              onNavigate={handleNavigate}
              onDelete={handleDelete}
              onUpload={handleUpload}
              onCreateFolder={handleCreateFolder}
              onDownload={handleDownload}
              onBulkDownload={handleBulkDownload}
              onFilePreview={handleFilePreview}
              allFolders={allFolders}
              uploading={uploading}
            />

            {/* Upload Overlay */}
            {uploading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-lg font-medium">Uploading...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bucket selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a bucket from the sidebar to start browsing files.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Preview Panel */}
      {isPreviewOpen && (
        <div className="w-80 min-w-[20rem] max-w-[25rem] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
          <FilePreview
            isOpen={isPreviewOpen}
            file={previewFile}
            bucket={selectedBucket || ''}
            onClose={handleClosePreview}
            onDownload={handleDownload}
          />
        </div>
      )}
    </div>
  );
}
