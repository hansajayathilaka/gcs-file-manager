'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, FolderIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { FolderOption } from '@/types/fileSystem';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[] | FileList, destinationPath: string) => void;
  bucket: string;
  currentPath: string;
  folders: FolderOption[];
  loading?: boolean;
  preSelectedFiles?: File[] | FileList | null;
}

export default function UploadDialog({
  isOpen,
  onClose,
  onUpload,
  bucket,
  currentPath,
  folders,
  loading = false,
  preSelectedFiles = null,
}: UploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>(currentPath);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');

  useEffect(() => {
    setSelectedPath(currentPath);
  }, [currentPath, isOpen]);

  useEffect(() => {
    if (preSelectedFiles) {
      const filesArray = Array.isArray(preSelectedFiles) ? preSelectedFiles : Array.from(preSelectedFiles);
      setSelectedFiles(filesArray);
      
      // Check if the files have folder structure (webkitRelativePath)
      const hasFolder = filesArray.some(file => (file as any).webkitRelativePath);
      if (hasFolder) {
        setUploadMode('folder');
      }
    }
  }, [preSelectedFiles]);

  useEffect(() => {
    console.log('UploadDialog - folders updated:', folders);
  }, [folders]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      
      // Check if this is a folder upload
      const hasFolder = filesArray.some(file => (file as any).webkitRelativePath);
      if (hasFolder) {
        setUploadMode('folder');
      } else {
        setUploadMode('files');
      }
    }
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      setUploadMode('folder');
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const items = event.dataTransfer.items;
    const files = event.dataTransfer.files;
    
    if (items) {
      // Check if any dropped items are directories
      const hasDirectories = Array.from(items).some(item => item.webkitGetAsEntry()?.isDirectory);
      
      if (hasDirectories) {
        // Handle directory drop - need to process entries
        console.log('Directory drop detected');
        const filesArray: File[] = [];
        
        // Process all items to extract files with paths
        const processItems = async () => {
          for (const item of Array.from(items)) {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              await traverseFileSystemEntry(entry, '', filesArray);
            }
          }
          
          setSelectedFiles(filesArray);
          setUploadMode('folder');
        };
        
        processItems();
      } else {
        // Regular file drop
        const filesArray = Array.from(files);
        setSelectedFiles(filesArray);
        
        // Check if this is a folder drop with webkitRelativePath
        const hasFolder = filesArray.some(file => (file as any).webkitRelativePath);
        if (hasFolder) {
          setUploadMode('folder');
        } else {
          setUploadMode('files');
        }
      }
    } else if (files) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      
      // Check if this is a folder drop
      const hasFolder = filesArray.some(file => (file as any).webkitRelativePath);
      if (hasFolder) {
        setUploadMode('folder');
      } else {
        setUploadMode('files');
      }
    }
  };

  // Helper function to traverse file system entries
  const traverseFileSystemEntry = async (entry: any, path: string, filesArray: File[]) => {
    if (entry.isFile) {
      return new Promise<void>((resolve) => {
        entry.file((file: File) => {
          // Add the relative path to the file object
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path + file.name,
            writable: false
          });
          filesArray.push(file);
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      return new Promise<void>((resolve) => {
        const readEntries = () => {
          dirReader.readEntries(async (entries: any[]) => {
            if (entries.length === 0) {
              resolve();
              return;
            }
            
            for (const childEntry of entries) {
              await traverseFileSystemEntry(childEntry, path + entry.name + '/', filesArray);
            }
            
            // Continue reading if there might be more entries
            readEntries();
          });
        };
        readEntries();
      });
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

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      console.log('UploadDialog - handleUpload called:', {
        fileCount: selectedFiles.length,
        uploadMode,
        selectedPath,
        currentPath
      });
      onUpload(selectedFiles, selectedPath);
      setSelectedFiles([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Upload {uploadMode === 'folder' ? 'Folder' : 'Files'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Upload Mode Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadMode"
                  value="files"
                  checked={uploadMode === 'files'}
                  onChange={() => setUploadMode('files')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Files</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadMode"
                  value="folder"
                  checked={uploadMode === 'folder'}
                  onChange={() => setUploadMode('folder')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Folder</span>
              </label>
            </div>
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {uploadMode === 'folder' ? 'Select Folder' : 'Select Files'}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50'
                  : selectedFiles.length > 0
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  <CloudArrowUpIcon className="h-12 w-12 text-green-500 mx-auto" />
                  {uploadMode === 'folder' ? (
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        {selectedFiles.length} files selected from folder
                      </p>
                      <p className="text-xs text-green-600">
                        Total size: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}
                      </p>
                      {selectedFiles.length > 0 && (selectedFiles[0] as any).webkitRelativePath && (
                        <p className="text-xs text-green-600">
                          Folder: {(selectedFiles[0] as any).webkitRelativePath.split('/')[0]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                      </p>
                      <p className="text-xs text-green-600">
                        Total size: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}
                      </p>
                      {selectedFiles.length === 1 && (
                        <p className="text-xs text-green-600">
                          {selectedFiles[0].name}
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Choose different {uploadMode === 'folder' ? 'folder' : 'files'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    {uploadMode === 'folder' 
                      ? 'Drop a folder here or ' 
                      : 'Drop files here or '}
                    <label className="text-indigo-600 hover:text-indigo-500 cursor-pointer underline">
                      browse
                      {uploadMode === 'folder' ? (
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFolderSelect}
                          {...({ webkitdirectory: '', directory: '' } as any)}
                          multiple
                        />
                      ) : (
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileSelect}
                          multiple
                        />
                      )}
                    </label>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Destination Path */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload to
            </label>
            {uploadMode === 'folder' && selectedFiles.length > 0 && (selectedFiles[0] as any).webkitRelativePath && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <strong>Folder Upload:</strong> The folder structure "{(selectedFiles[0] as any).webkitRelativePath.split('/')[0]}" will be preserved.
                  {selectedPath ? ` It will be placed inside: /${selectedPath}` : ' It will be placed in the root directory.'}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <select
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">/ (Root)</option>
                {folders.map((folder) => (
                  <option key={folder.path} value={folder.path}>
                    {'  '.repeat(folder.level)}{folder.name}/
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500">
              Bucket: {bucket}
              {selectedPath && (
                <>
                  <br />
                  Destination: /{selectedPath}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Uploading...' : `Upload ${selectedFiles.length} ${uploadMode === 'folder' ? 'files' : selectedFiles.length === 1 ? 'file' : 'files'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
