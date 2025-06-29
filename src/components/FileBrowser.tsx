'use client';

import { useState, useEffect } from 'react';
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
  onDelete: (fileName: string, isFolder: boolean) => Promise<void>;
  onUpload: (files: File[] | FileList, destinationPath: string) => void;
  onCreateFolder: (folderName: string) => void;
  onDownload: (item: FileTreeItem) => void;
  onBulkDownload: (items: FileTreeItem[]) => void;
  onFilePreview: (item: FileTreeItem) => void;
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
  onBulkDownload,
  onFilePreview,
  allFolders,
  uploading = false,
}: FileBrowserProps) {
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);

  // Add keyboard event listener for shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClearSelection();
      } else if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        handleSelectAll();
      } else if (event.key === 'Delete' && selectedItems.size > 0) {
        event.preventDefault();
        handleBulkDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItems.size]);

  // Add useEffect to handle indeterminate state for header checkbox
  useEffect(() => {
    const headerCheckbox = document.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
    if (headerCheckbox) {
      const isAllSelected = selectedItems.size === files.length && files.length > 0;
      const isSomeSelected = selectedItems.size > 0 && selectedItems.size < files.length;
      
      headerCheckbox.checked = isAllSelected;
      headerCheckbox.indeterminate = isSomeSelected;
    }
  }, [selectedItems.size, files.length]);

  // Clear selection when navigating to different path
  useEffect(() => {
    handleClearSelection();
  }, [currentPath]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolder(false);
    }
  };

  const handleCheckboxSelect = (itemPath: string) => {
    setIsMultiSelectMode(true);
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemPath)) {
      newSelected.delete(itemPath);
      // If no items are selected, exit multi-select mode
      if (newSelected.size === 0) {
        setIsMultiSelectMode(false);
      }
    } else {
      newSelected.add(itemPath);
    }
    setSelectedItems(newSelected);
  };

  const handleRowClick = (itemPath: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd click for multi-select
      setIsMultiSelectMode(true);
      const newSelected = new Set(selectedItems);
      if (newSelected.has(itemPath)) {
        newSelected.delete(itemPath);
        if (newSelected.size === 0) {
          setIsMultiSelectMode(false);
        }
      } else {
        newSelected.add(itemPath);
      }
      setSelectedItems(newSelected);
    } else {
      // Single click just highlights the row
      setHighlightedItem(itemPath);
    }
  };

  const handleRowDoubleClick = (itemPath: string) => {
    const item = files.find(f => f.path === itemPath);
    if (!item) return;
    
    if (item.isFolder) {
      onNavigate(item.path);
    } else {
      onFilePreview(item);
    }
  };

  const handleSelectAll = () => {
    setSelectedItems(new Set(files.map(f => f.path)));
    setIsMultiSelectMode(true);
  };

  const handleHeaderCheckboxSelect = () => {
    if (selectedItems.size === files.length && files.length > 0) {
      // All are selected, so deselect all
      handleClearSelection();
    } else {
      // Not all are selected, so select all
      handleSelectAll();
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
    setIsMultiSelectMode(false);
    setHighlightedItem(null);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    const itemsToDelete = files.filter(f => selectedItems.has(f.path));
    const fileCount = itemsToDelete.filter(f => !f.isFolder).length;
    const folderCount = itemsToDelete.filter(f => f.isFolder).length;
    
    let confirmMessage = `Are you sure you want to delete ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''}?`;
    if (fileCount > 0 && folderCount > 0) {
      confirmMessage = `Are you sure you want to delete ${fileCount} file${fileCount > 1 ? 's' : ''} and ${folderCount} folder${folderCount > 1 ? 's' : ''}?`;
    } else if (fileCount > 0) {
      confirmMessage = `Are you sure you want to delete ${fileCount} file${fileCount > 1 ? 's' : ''}?`;
    } else if (folderCount > 0) {
      confirmMessage = `Are you sure you want to delete ${folderCount} folder${folderCount > 1 ? 's' : ''} and all their contents?`;
    }
    confirmMessage += ' This action cannot be undone.';
    
    if (!confirm(confirmMessage)) return;
    
    // Delete items one by one and track failures
    const failures: string[] = [];
    let successCount = 0;
    
    for (const item of itemsToDelete) {
      try {
        await onDelete(item.name, item.isFolder);
        successCount++;
      } catch (error) {
        console.error(`Failed to delete ${item.name}:`, error);
        failures.push(item.name);
      }
    }
    
    // Show summary of results
    if (failures.length > 0) {
      alert(`Deleted ${successCount} item${successCount !== 1 ? 's' : ''} successfully. Failed to delete: ${failures.join(', ')}`);
    } else if (successCount > 0) {
      // Only show success message if there were no failures and items were actually deleted
      console.log(`Successfully deleted ${successCount} item${successCount !== 1 ? 's' : ''}`);
    }
    
    // Clear selection after deletion attempt
    handleClearSelection();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
      setShowUploadDialog(true);
      // Reset the input
      event.target.value = '';
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
        // Handle directory drop
        console.log('Directory drop detected in FileBrowser');
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
          setShowUploadDialog(true);
        };
        
        processItems();
      } else {
        // Regular file drop
        const filesArray = Array.from(files);
        setSelectedFiles(filesArray);
        setShowUploadDialog(true);
      }
    } else if (files) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      setShowUploadDialog(true);
    }
  };

  // Helper function to traverse file system entries (same as in UploadDialog)
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

  const handleBulkDownload = () => {
    if (selectedItems.size === 0) return;
    
    const itemsToDownload = files.filter(f => selectedItems.has(f.path) && !f.isFolder);
    
    if (itemsToDownload.length === 0) {
      alert('No files selected for download. Folders cannot be downloaded.');
      return;
    }
    
    if (itemsToDownload.length === 1) {
      // Single file, use regular download
      onDownload(itemsToDownload[0]);
    } else {
      // Multiple files, use bulk download (zip)
      onBulkDownload(itemsToDownload);
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
                setSelectedFiles([]);
                setShowUploadDialog(true);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Upload Files
            </button>

            {/* Multi-select actions */}
            {isMultiSelectMode && (
              <>
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Select All
                </button>
                
                <button
                  onClick={handleClearSelection}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Selection
                </button>
                
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleBulkDownload}
                    className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download ({selectedItems.size})
                  </button>
                )}
                
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete ({selectedItems.size})
                  </button>
                )}
              </>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {selectedItems.size > 0 ? (
              <span className="text-indigo-600">
                {selectedItems.size} of {files.length} selected
              </span>
            ) : (
              <span>
                {files.length} {files.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
        </div>

        {/* Multi-select instructions */}
        {!isMultiSelectMode && files.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Tip: Hold Ctrl/⌘ and click to select multiple items
          </div>
        )}
        
        {/* Create Folder Modal */}
        {showCreateFolder && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === files.length && files.length > 0}
                      onChange={handleHeaderCheckboxSelect}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
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
                  <tr 
                    key={item.path} 
                    className={`transition-colors cursor-pointer ${
                      selectedItems.has(item.path) ? 'bg-blue-50' : ''
                    } ${highlightedItem === item.path ? 'bg-gray-100' : ''} hover:bg-gray-50`}
                    onClick={(e) => {
                      // Don't trigger row click if clicking on action buttons
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'BUTTON' || target.closest('button')) {
                        return;
                      }
                      
                      // Handle checkbox clicks or Ctrl+click for selection
                      if ((target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') || e.ctrlKey || e.metaKey) {
                        handleRowClick(item.path, e);
                      } else {
                        // Single row click just highlights
                        setHighlightedItem(item.path);
                      }
                    }}
                    onDoubleClick={(e) => {
                      // Prevent double-click on checkbox/buttons
                      const target = e.target as HTMLElement;
                      if ((target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') || target.tagName === 'BUTTON' || target.closest('button')) {
                        return;
                      }
                      
                      // Double-click handles both folders and files
                      handleRowDoubleClick(item.path);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.path)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheckboxSelect(item.path);
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(item)}
                        <span
                          className={`ml-3 text-sm font-medium ${
                            item.isFolder 
                              ? 'text-blue-600' 
                              : 'text-gray-900'
                          }`}
                        >
                          {item.name}
                        </span>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownload(item);
                            }}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        )}
                        {!isMultiSelectMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.name, item.isFolder);
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
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

      {/* Upload Dialog */}        <UploadDialog
          isOpen={showUploadDialog}
          onClose={() => {
            setShowUploadDialog(false);
            setSelectedFiles([]);
          }}
          onUpload={onUpload}
          bucket={bucket}
          currentPath={currentPath}
          folders={allFolders}
          loading={uploading}
          preSelectedFiles={selectedFiles}
        />
    </div>
  );
}
