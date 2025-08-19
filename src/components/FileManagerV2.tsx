'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useFileOperations } from '@/contexts/FileOperationsContext';
import { auth } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import BucketSidebar from '@/components/BucketSidebar';
import Breadcrumb from '@/components/Breadcrumb';
import FileBrowser from '@/components/FileBrowser';
import FilePreview from '@/components/FilePreview';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import ShareDialog from '@/components/shared/ShareDialog';
import ShareLinksManager from '@/components/shared/ShareLinksManager';
import RenameDialog from '@/components/shared/RenameDialog';
import { FileTreeItem, BreadcrumbItem, FolderOption } from '@/types/fileSystem';

interface FileManagerV2Props {
  allowedBuckets: string[];
}

export default function FileManagerV2({ allowedBuckets }: FileManagerV2Props) {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const { clipboard, clearClipboard } = useFileOperations();
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allFolders, setAllFolders] = useState<FolderOption[]>([]);
  const [previewFile, setPreviewFile] = useState<FileTreeItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{name: string, isFolder: boolean} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareFile, setShareFile] = useState<FileTreeItem | null>(null);
  const [shareLinksManagerOpen, setShareLinksManagerOpen] = useState(false);
  
  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<FileTreeItem | null>(null);

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
        showError('Failed to load files', data.error || 'Unknown error occurred');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      showError('Network Error', 'Failed to connect to server. Please try again.');
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
    
    logger.debug('Upload starting', { fileCount: filesArray.length, destinationPath, currentPath });

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
      
      logger.debug('FormData prepared', { fileCount: filesArray.length, bucket: selectedBucket, currentPath: destinationPath });

      const headers = await getAuthHeaders();
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers,
      });

      const data = await response.json();
      logger.debug('Upload response', data);
      
      if (data.success) {
        // Reload folders structure since we might have uploaded to a new location
        loadAllFolders(selectedBucket);
        
        // If uploaded to current path, reload current view
        // If uploaded to different path, show success message
        if (destinationPath === currentPath) {
          logger.debug('Upload completed to current path');
          loadFiles(selectedBucket, currentPath);
        } else {
          // Show success message and optionally navigate to the upload location
          logger.debug('Upload completed to different path', { destinationPath });
          showSuccess('Upload Successful', `${data.successCount} file${data.successCount !== 1 ? 's' : ''} uploaded successfully to: ${destinationPath || 'root'}`);
          loadFiles(selectedBucket, currentPath); // Still refresh current view in case of .keep files etc.
        }
      } else {
        console.error('Upload failed:', data.error);
        showError('Upload Failed', data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showError('Upload Failed', 'Network error occurred. Please try again.');
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
        showSuccess('Folder Created', `Folder "${folderName}" created successfully`);
      } else {
        console.error('Create folder failed:', data.error);
        showError('Create Folder Failed', data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      showError('Create Folder Failed', 'Network error occurred. Please try again.');
    }
  };

  const handleDelete = async (fileName: string, isFolder: boolean = false): Promise<void> => {
    // Open confirmation modal instead of using browser confirm
    setDeleteItem({ name: fileName, isFolder });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem || !selectedBucket) return;

    setDeleteLoading(true);
    try {
      const headers = await getAuthHeaders();
      // Find the file item to get the stored path
      const fileItem = files.find(f => f.name === deleteItem.name);
      const fullPath = fileItem?.storedPath || (currentPath + deleteItem.name);
      
      const url = new URL('/api/delete', window.location.origin);
      url.searchParams.append('bucket', selectedBucket);
      url.searchParams.append('file', fullPath);
      url.searchParams.append('isFolder', deleteItem.isFolder.toString());
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      if (data.success) {
        // Reload files to reflect the deletion
        loadFiles(selectedBucket, currentPath);
        showSuccess('Delete Successful', `${deleteItem.isFolder ? 'Folder' : 'File'} "${deleteItem.name}" deleted successfully`);
        setDeleteConfirmOpen(false);
        setDeleteItem(null);
      } else {
        console.error('Delete failed:', data.error);
        showError('Delete Failed', data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      showError('Delete Failed', 'Network error occurred. Please try again.');
    } finally {
      setDeleteLoading(false);
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
        a.download = item.name; // Use current name for download (reflects renames)
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        console.error('Download failed:', errorData.error);
        showError('Download failed', errorData.error);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      showError('Download failed', 'An unexpected error occurred');
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
        showError('Bulk download failed', errorData.error);
      }
    } catch (error) {
      console.error('Error downloading files:', error);
      showError('Bulk download failed', 'An unexpected error occurred');
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

  const handleShare = (file: FileTreeItem) => {
    setShareFile(file);
    setShareDialogOpen(true);
  };

  const handleRename = (item: FileTreeItem) => {
    setRenameItem(item);
    setRenameDialogOpen(true);
  };

  const performRename = async (newName: string) => {
    if (!renameItem || !selectedBucket) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          bucket: selectedBucket,
          oldPath: renameItem.storedPath || renameItem.path,
          newName,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Rename Successful', data.message);
        loadFiles(selectedBucket, currentPath);
        setRenameDialogOpen(false);
        setRenameItem(null);
      } else {
        showError('Rename Failed', data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error renaming item:', error);
      showError('Rename Failed', 'Network error occurred. Please try again.');
    }
  };

  const handleCopy = async (item: FileTreeItem) => {
    if (!selectedBucket || !clipboard) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          bucket: selectedBucket,
          sourcePath: clipboard.item.storedPath || clipboard.item.path,
          destinationPath: currentPath,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Copy Successful', data.message);
        loadFiles(selectedBucket, currentPath);
        clearClipboard();
      } else {
        showError('Copy Failed', data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error copying item:', error);
      showError('Copy Failed', 'Network error occurred. Please try again.');
    }
  };

  const handleMove = async (item: FileTreeItem) => {
    if (!selectedBucket || !clipboard) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          bucket: selectedBucket,
          sourcePath: clipboard.item.storedPath || clipboard.item.path,
          destinationPath: currentPath,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showSuccess('Move Successful', data.message);
        loadFiles(selectedBucket, currentPath);
        clearClipboard();
      } else {
        showError('Move Failed', data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error moving item:', error);
      showError('Move Failed', 'Network error occurred. Please try again.');
    }
  };

  const handlePaste = () => {
    if (!clipboard) return;
    
    if (clipboard.operation === 'copy') {
      handleCopy(clipboard.item);
    } else if (clipboard.operation === 'cut') {
      handleMove(clipboard.item);
    }
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
              onShare={handleShare}
              onManageShares={() => setShareLinksManagerOpen(true)}
              onRename={handleRename}
              onPaste={handlePaste}
              allFolders={allFolders}
              uploading={uploading}
            />

            {/* Upload Overlay */}
            {uploading && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={confirmDelete}
        title={deleteItem?.isFolder ? "Delete Folder" : "Delete File"}
        message={
          deleteItem?.isFolder 
            ? `Are you sure you want to delete the folder "${deleteItem?.name}" and all its contents? This action cannot be undone.`
            : `Are you sure you want to delete the file "${deleteItem?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteLoading}
      />

      {/* Share Dialog */}
      {shareFile && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setShareFile(null);
          }}
          file={shareFile}
          bucket={selectedBucket || ''}
        />
      )}

      {/* Share Links Manager */}
      <ShareLinksManager
        isOpen={shareLinksManagerOpen}
        onClose={() => setShareLinksManagerOpen(false)}
      />

      {/* Rename Dialog */}
      {renameItem && (
        <RenameDialog
          isOpen={renameDialogOpen}
          onClose={() => {
            setRenameDialogOpen(false);
            setRenameItem(null);
          }}
          onRename={performRename}
          currentName={renameItem.name}
          isFolder={renameItem.isFolder}
        />
      )}
    </div>
  );
}
