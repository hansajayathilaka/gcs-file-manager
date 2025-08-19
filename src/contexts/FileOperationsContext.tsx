'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { FileTreeItem } from '@/types/fileSystem';

interface ClipboardItem {
  item: FileTreeItem;
  operation: 'copy' | 'cut';
}

interface FileOperationsContextType {
  clipboard: ClipboardItem | null;
  copyToClipboard: (item: FileTreeItem) => void;
  cutToClipboard: (item: FileTreeItem) => void;
  clearClipboard: () => void;
  hasClipboardItem: () => boolean;
  canPaste: (currentPath: string) => boolean;
}

const FileOperationsContext = createContext<FileOperationsContextType | undefined>(undefined);

export function FileOperationsProvider({ children }: { children: ReactNode }) {
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);

  const copyToClipboard = (item: FileTreeItem) => {
    setClipboard({ item, operation: 'copy' });
  };

  const cutToClipboard = (item: FileTreeItem) => {
    setClipboard({ item, operation: 'cut' });
  };

  const clearClipboard = () => {
    setClipboard(null);
  };

  const hasClipboardItem = () => {
    return clipboard !== null;
  };

  const canPaste = (currentPath: string) => {
    if (!clipboard) return false;
    
    // Can't paste item into itself or its parent if it's the same location
    const itemPath = clipboard.item.path;
    const itemParentPath = itemPath.substring(0, itemPath.lastIndexOf('/') + 1);
    
    // For cut operations, can't paste in the same location
    if (clipboard.operation === 'cut' && itemParentPath === currentPath) {
      return false;
    }
    
    // Can't paste folder into itself or its subdirectory
    if (clipboard.item.isFolder && currentPath.startsWith(itemPath)) {
      return false;
    }
    
    return true;
  };

  const value = {
    clipboard,
    copyToClipboard,
    cutToClipboard,
    clearClipboard,
    hasClipboardItem,
    canPaste,
  };

  return (
    <FileOperationsContext.Provider value={value}>
      {children}
    </FileOperationsContext.Provider>
  );
}

export function useFileOperations() {
  const context = useContext(FileOperationsContext);
  if (context === undefined) {
    throw new Error('useFileOperations must be used within a FileOperationsProvider');
  }
  return context;
}