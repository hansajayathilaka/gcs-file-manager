export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface GCSFile {
  name: string;
  bucket: string;
  size: number;
  timeCreated: string;
  updated: string;
  contentType?: string;
  downloadUrl?: string;
}

export interface GCSBucket {
  name: string;
  location?: string;
  storageClass?: string;
  created?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface BucketConfig {
  allowedBuckets: string[];
  currentBucket: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface FileUploadResponse {
  success: boolean;
  fileName: string;
  downloadUrl?: string;
  error?: string;
}

export interface BucketListResponse {
  success: boolean;
  files: GCSFile[];
  error?: string;
}

export interface DeleteFileResponse {
  success: boolean;
  error?: string;
}
