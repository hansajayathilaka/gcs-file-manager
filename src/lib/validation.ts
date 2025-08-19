/**
 * Input validation utilities for API endpoints
 */

// File type validation
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Archives
  'application/zip', 'application/x-zip-compressed', 'application/gzip', 'application/x-tar',
  // Code files
  'text/javascript', 'text/html', 'text/css', 'application/json', 'text/xml',
  // Video
  'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
  // Audio
  'audio/mp3', 'audio/wav', 'audio/ogg'
];

// File size limits (in bytes)
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB for bulk uploads

// Path validation
export const PATH_REGEX = /^[a-zA-Z0-9\/_\-.\s]*$/;
export const BUCKET_NAME_REGEX = /^[a-z0-9]([a-z0-9\-._]*[a-z0-9])?$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: any;
}

/**
 * Validate bucket name
 */
export function validateBucketName(bucketName: string): ValidationResult {
  if (!bucketName) {
    return { isValid: false, error: 'Bucket name is required' };
  }
  
  if (typeof bucketName !== 'string') {
    return { isValid: false, error: 'Bucket name must be a string' };
  }
  
  if (bucketName.length < 3 || bucketName.length > 63) {
    return { isValid: false, error: 'Bucket name must be between 3 and 63 characters' };
  }
  
  if (!BUCKET_NAME_REGEX.test(bucketName)) {
    return { isValid: false, error: 'Invalid bucket name format' };
  }
  
  return { isValid: true };
}

/**
 * Validate file path
 */
export function validatePath(path: string): ValidationResult {
  if (path && !PATH_REGEX.test(path)) {
    return { 
      isValid: false, 
      error: 'Path contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, dots, and forward slashes are allowed' 
    };
  }
  
  if (path && path.includes('..')) {
    return { isValid: false, error: 'Path traversal is not allowed' };
  }
  
  if (path && path.length > 1000) {
    return { isValid: false, error: 'Path is too long (maximum 1000 characters)' };
  }
  
  return { isValid: true };
}

/**
 * Validate file uploads
 */
export function validateFile(file: File): ValidationResult {
  if (!file || !(file instanceof File)) {
    return { isValid: false, error: 'Invalid file object' };
  }
  
  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `File size exceeds maximum allowed size of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB` 
    };
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: `File type '${file.type}' is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.slice(0, 5).join(', ')}...` 
    };
  }
  
  // Validate filename
  const nameValidation = validateFileName(file.name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }
  
  return { isValid: true };
}

/**
 * Validate filename
 */
export function validateFileName(fileName: string): ValidationResult {
  if (!fileName) {
    return { isValid: false, error: 'Filename is required' };
  }
  
  if (typeof fileName !== 'string') {
    return { isValid: false, error: 'Filename must be a string' };
  }
  
  if (fileName.length > 255) {
    return { isValid: false, error: 'Filename is too long (maximum 255 characters)' };
  }
  
  // Check for dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) {
    return { isValid: false, error: 'Filename contains invalid characters' };
  }
  
  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(fileName)) {
    return { isValid: false, error: 'Filename uses a reserved name' };
  }
  
  return { isValid: true };
}

/**
 * Validate bulk file upload
 */
export function validateBulkUpload(files: File[]): ValidationResult {
  if (!Array.isArray(files)) {
    return { isValid: false, error: 'Files must be an array' };
  }
  
  if (files.length === 0) {
    return { isValid: false, error: 'No files provided' };
  }
  
  if (files.length > 50) {
    return { isValid: false, error: 'Too many files (maximum 50 files per upload)' };
  }
  
  let totalSize = 0;
  const invalidFiles: string[] = [];
  
  for (const file of files) {
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      invalidFiles.push(`${file.name}: ${fileValidation.error}`);
      continue;
    }
    
    totalSize += file.size;
  }
  
  if (invalidFiles.length > 0) {
    return { 
      isValid: false, 
      error: 'Invalid files detected', 
      details: invalidFiles 
    };
  }
  
  if (totalSize > MAX_TOTAL_SIZE) {
    return { 
      isValid: false, 
      error: `Total file size exceeds maximum allowed size of ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB` 
    };
  }
  
  return { isValid: true };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: { page?: string; limit?: string }): ValidationResult {
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '50', 10);
  
  if (isNaN(page) || page < 1 || page > 10000) {
    return { isValid: false, error: 'Invalid page number (must be between 1 and 10000)' };
  }
  
  if (isNaN(limit) || limit < 1 || limit > 1000) {
    return { isValid: false, error: 'Invalid limit (must be between 1 and 1000)' };
  }
  
  return { isValid: true, details: { page, limit } };
}