export interface GCSFile {
  name: string;
  bucket: string;
  size: number;
  timeCreated: string;
  updated: string;
  contentType?: string;
  downloadUrl?: string;
  isFolder?: boolean;
  prefix?: string;
}

export interface GCSFolder {
  name: string;
  prefix: string;
  bucket: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FileTreeItem {
  name: string;
  path: string;
  isFolder: boolean;
  size?: number;
  modified?: string;
  contentType?: string;
  originalName?: string;
  storedPath?: string;
}

export interface CreateFolderRequest {
  bucket: string;
  folderName: string;
  currentPath: string;
}
