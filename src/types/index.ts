export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  bucketPermissions: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  permissions?: BucketPermission[];
}

export interface BucketPermission {
  userId: string;
  bucketName: string;
  permissions: ('read' | 'write' | 'delete')[];
  grantedBy: string;
  grantedAt: string;
}

export interface ManagedBucket {
  name: string;
  displayName: string;
  location: string;
  storageClass: string;
  createdBy: string;
  createdAt: string;
  description?: string;
  isActive: boolean;
  allowedUsers: string[];
  imported?: boolean;
  importedAt?: Date;
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

export interface UserBucketConfig {
  userBuckets: string[];
  currentBucket: string | null;
  permissions: Record<string, ('read' | 'write' | 'delete')[]>;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasBucketAccess: (bucketName: string) => boolean;
  refreshProfile: () => Promise<void>;
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

export interface AdminUserListResponse {
  success: boolean;
  users: UserProfile[];
  error?: string;
}

export interface AdminBucketCreateRequest {
  name: string;
  displayName: string;
  location: string;
  storageClass: 'STANDARD' | 'NEARLINE' | 'COLDLINE' | 'ARCHIVE';
  description?: string;
}

export interface AdminBucketCreateResponse {
  success: boolean;
  bucket?: ManagedBucket;
  error?: string;
}

export interface DiscoverableBucket {
  name: string;
  location: string;
  storageClass: string;
  created: string;
  updated: string;
  metageneration: number;
}

export interface BucketImportRequest {
  buckets: {
    name: string;
    displayName?: string;
    description?: string;
  }[];
}

export interface BucketImportResult {
  name: string;
  success: boolean;
  bucket?: ManagedBucket;
  error?: string;
}

export interface BucketImportResponse {
  success: boolean;
  message?: string;
  results?: BucketImportResult[];
  summary?: {
    total: number;
    successful: number;
    failed: number;
  };
  error?: string;
}

export interface BucketDiscoveryResponse {
  success: boolean;
  availableBuckets?: DiscoverableBucket[];
  totalGcsBuckets?: number;
  alreadyManaged?: number;
  error?: string;
}

export interface AdminPermissionRequest {
  userId: string;
  bucketName: string;
  permissions: ('read' | 'write' | 'delete')[];
}

export interface AdminPermissionResponse {
  success: boolean;
  error?: string;
}

export interface UserRegistrationRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: 'bucket' | 'user' | 'permission' | 'shared_link';
  resourceId: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
}

export interface ShareableLink {
  id: string;
  token: string;
  bucketName: string;
  filePath: string;
  fileName: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
  accessCount: number;
  maxAccess?: number;
  lastAccessedAt?: string;
  description?: string;
}

export interface ShareableLinkRequest {
  bucketName: string;
  filePath: string;
  expiresInHours: number;
  maxAccess?: number;
  description?: string;
}

export interface ShareableLinkResponse {
  success: boolean;
  shareableLink?: ShareableLink & { shareUrl: string };
  error?: string;
}

export interface ShareableLinkListResponse {
  success: boolean;
  links: ShareableLink[];
  error?: string;
}
