'use client';

import { useState } from 'react';
import { 
  FolderIcon, 
  DocumentIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  PlusIcon,
  CloudArrowUpIcon 
} from '@heroicons/react/24/outline';
import { FileTreeItem, CreateFolderRequest, FolderOption } from '@/types/fileSystem';
import UploadDialog from './UploadDialog';

interface FileBrowserProps {
  files: FileTreeItem[];
  currentPath: string;
  bucket: string;
  loading: boolean;
  onNavigate: (path: string) => void;
  onDelete: (fileName: string, isFolder: boolean) => void;
  onUpload: (file: File, destinationPath: string) => void;
  onCreateFolder: (folderName: string) => void;
  onDownload: (item: FileTreeItem) => void;
  allFolders: FolderOption[];
  uploading?: boolean;
}

export default function FileBrowser({
  files,
  currentPath,
  bucket,
  loading,
  onNavigate,
  onDelete,
  onUpload,
  onCreateFolder,
  onDownload,
  allFolders,
  uploading = false,
}: FileBrowserProps) {
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadDialog(true);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setShowUploadDialog(true);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
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

  const getFileIcon = (item: FileTreeItem) => {
    if (item.isFolder) {
      return <FolderIcon className="h-5 w-5 text-blue-500" />;
    }
    
    const extension = item.name.split('.').pop()?.toLowerCase();
    const iconClass = "h-5 w-5";
    
    switch (extension) {
      case 'pdf':
        return <DocumentIcon className={`${iconClass} text-red-500`} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <DocumentIcon className={`${iconClass} text-green-500`} />;
      case 'doc':
      case 'docx':
        return <DocumentIcon className={`${iconClass} text-blue-600`} />;
      case 'xls':
      case 'xlsx':
        return <DocumentIcon className={`${iconClass} text-green-600`} />;
      default:
        return <DocumentIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Folder
            </button>
            
            <button
              onClick={() => {
                setSelectedFile(null);
                setShowUploadDialog(true);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Upload File
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {files.length} {files.length === 1 ? 'item' : 'items'}
          </div>
        </div>
        
        {/* Create Folder Modal */}
        {showCreateFolder && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div
        className={`flex-1 overflow-auto ${dragOver ? 'bg-indigo-50 border-2 border-dashed border-indigo-300' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FolderIcon className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium">This folder is empty</p>
            <p className="text-sm">Upload files or create folders to get started</p>
          </div>
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
                {files.map((item) => (
                  <tr key={item.path} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(item)}
                        <button
                          onClick={() => item.isFolder ? onNavigate(item.path) : undefined}
                          className={`ml-3 text-sm font-medium ${
                            item.isFolder 
                              ? 'text-blue-600 hover:text-blue-800 cursor-pointer' 
                              : 'text-gray-900'
                          }`}
                        >
                          {item.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.isFolder ? '—' : formatFileSize(item.size || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.modified ? formatDate(item.modified) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {!item.isFolder && (
                          <button
                            onClick={() => onDownload(item)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(item.name, item.isFolder)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-indigo-50 bg-opacity-75">
            <div className="text-center">
              <CloudArrowUpIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-indigo-700">Drop file to upload</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false);
          setSelectedFile(null);
        }}
        onUpload={onUpload}
        bucket={bucket}
        currentPath={currentPath}
        folders={allFolders}
        loading={uploading}
        preSelectedFile={selectedFile}
      />
    </div>
  );
}
