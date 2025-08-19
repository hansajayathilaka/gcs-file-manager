'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
  isFolder: boolean;
}

export default function RenameDialog({ 
  isOpen, 
  onClose, 
  onRename, 
  currentName, 
  isFolder 
}: RenameDialogProps) {
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Remove extension for files to make it easier to rename
      if (!isFolder && currentName.includes('.')) {
        const extensionIndex = currentName.lastIndexOf('.');
        setNewName(currentName.substring(0, extensionIndex));
      } else {
        setNewName(currentName);
      }
    }
  }, [isOpen, currentName, isFolder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let finalName = newName.trim();
    
    // For files, preserve the original extension if user didn't include it
    if (!isFolder && currentName.includes('.')) {
      const originalExt = currentName.substring(currentName.lastIndexOf('.'));
      if (!finalName.includes('.')) {
        finalName += originalExt;
      }
    }

    setIsLoading(true);
    try {
      await onRename(finalName);
      onClose();
    } catch (error) {
      console.error('Rename failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Rename ${isFolder ? 'Folder' : 'File'}`}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-2">
            New name
          </label>
          <input
            id="newName"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={`Enter new ${isFolder ? 'folder' : 'file'} name`}
            autoFocus
            disabled={isLoading}
          />
          {!isFolder && currentName.includes('.') && (
            <p className="mt-1 text-xs text-gray-500">
              Extension will be preserved if not specified
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newName.trim() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Renaming...' : 'Rename'}
          </button>
        </div>
      </form>
    </Modal>
  );
}