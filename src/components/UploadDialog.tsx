'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, FolderIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { FolderOption } from '@/types/fileSystem';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, destinationPath: string) => void;
  bucket: string;
  currentPath: string;
  folders: FolderOption[];
  loading?: boolean;
  preSelectedFile?: File | null;
}

export default function UploadDialog({
  isOpen,
  onClose,
  onUpload,
  bucket,
  currentPath,
  folders,
  loading = false,
  preSelectedFile = null,
}: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>(currentPath);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setSelectedPath(currentPath);
  }, [currentPath, isOpen]);

  useEffect(() => {
    if (preSelectedFile) {
      setSelectedFile(preSelectedFile);
    }
  }, [preSelectedFile]);

  useEffect(() => {
    console.log('UploadDialog - folders updated:', folders);
  }, [folders]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
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
    if (selectedFile) {
      console.log('UploadDialog - handleUpload called:', {
        fileName: selectedFile.name,
        selectedPath,
        currentPath
      });
      onUpload(selectedFile, selectedPath);
      setSelectedFile(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
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
          <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* File Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select File
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50'
                  : selectedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <CloudArrowUpIcon className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-green-700">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Drop a file here or{' '}
                    <label className="text-indigo-600 hover:text-indigo-500 cursor-pointer underline">
                      browse
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
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
            <div className="space-y-1">
              <select
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  Path: /{selectedPath}
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
            disabled={!selectedFile || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
