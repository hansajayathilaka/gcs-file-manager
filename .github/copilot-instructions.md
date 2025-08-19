# GitHub Copilot Instructions for FileManager

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js application for managing Google Cloud Storage (GCS) buckets with Firebase authentication and comprehensive user authorization. The application features:
- **Multi-user system** with role-based access control (admin/user)
- **Per-user bucket permissions** managed by administrators
- **Modern three-panel layout** with persistent file preview system
- **Streaming video support** and comprehensive file management
- **Admin dashboard** for user and bucket management
- **Automatic GCP IAM integration** for secure bucket access
- **Infrastructure as Code (Terraform)** for automated deployment

## Key Technologies
- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom responsive design patterns
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Database**: Firestore for user profiles, permissions, and audit logs
- **Authorization**: Role-based access control with per-user bucket permissions
- **Storage**: Google Cloud Storage (GCS) with streaming support
- **File Preview**: Multi-format preview with streaming for large videos
- **Infrastructure**: Terraform for automated GCP resource provisioning
- **Deployment**: Google Cloud Run with GitHub Actions CI/CD
- **Security**: Workload Identity for keyless authentication
- **State Management**: React hooks and context with user profile management

## Project Structure
- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable React components
  - `FileManagerV2.tsx` - Main three-panel layout component
  - `FilePreview.tsx` - Right-panel file preview with streaming support
  - `FileBrowser.tsx` - File listing and management
  - `UploadDialog.tsx` - File/folder upload with drag-and-drop
  - `LoginForm.tsx` - Authentication forms
  - `AdminDashboard.tsx` - Admin interface for user/bucket management
  - `UserProfile.tsx` - User profile and permission viewing
  - `admin/` - Admin-specific components (UserManagement, BucketManagement)
- `/src/lib` - Utility functions, Firebase config, GCS clients, database operations
- `/src/types` - TypeScript type definitions including authorization types
- `/src/hooks` - Custom React hooks
- `/src/app/api` - API routes for file operations, user management, and admin functions
- `/terraform` - Infrastructure as Code configuration
- `/docs` - Organized documentation (setup guides, GitHub configuration)
- `/.github/workflows` - CI/CD workflows for infrastructure and deployment

## Authentication & Authorization Implementation

### Firebase Authentication
- Firebase Auth for user authentication (email/password + Google OAuth)
- User registration creates profile in Firestore with 'user' role by default
- Enhanced AuthContext manages both Firebase user and user profile
- Automatic profile initialization for existing Firebase users

### Role-Based Access Control
- **Admin Role**: Full access to all buckets, user management, bucket creation
- **User Role**: Access only to explicitly granted buckets
- Role-based UI rendering and route protection
- Admin dashboard at `/admin` for user and bucket management

### Authorization Middleware
- `withAuth`: Basic authentication required
- `withAdminAuth`: Admin role required
- `requireBucketAccess`: Check user has access to specific bucket
- Support for auth tokens in both headers and query parameters (for streaming)

### Permission Management
- Per-user bucket permissions stored in Firestore
- Admins can grant/revoke bucket access through UI
- Automatic permission synchronization with user profiles
- Audit logging for all permission changes

## Infrastructure & Deployment

### Terraform Infrastructure
- **Automated Provisioning**: All GCP resources managed via Terraform
- **Security-First**: Workload Identity for keyless GitHub Actions authentication
- **Resource Management**: Cloud Run, Artifact Registry, Storage buckets, IAM roles
- **Environment Support**: Configurable for dev, staging, and production environments
- **State Management**: Terraform tracks all infrastructure state and changes

### GitHub Actions Workflows
- **Infrastructure Management**: `terraform.yml` for provisioning GCP resources
- **Application Deployment**: `deploy.yml` for building and deploying to Cloud Run
- **Variable-Driven**: Uses GitHub Variables and Secrets for secure configuration
- **Validation**: Comprehensive error checking and validation before deployment

### Configuration Standards
- **No Hard-Coded Defaults**: All configuration must be explicitly set via GitHub Variables
- **Secure by Default**: Workload Identity preferred over service account keys
- **Environment Variables**: Clear separation of public and private configuration
- **Documentation**: Comprehensive setup guides with validation steps

## UI/UX Design Patterns

### Three-Panel Layout
- **Left Panel**: Sidebar for navigation and bucket selection (user-specific)
- **Center Panel**: Main file browser with table view and bulk operations
- **Right Panel**: Persistent file preview panel (not modal)

### File Preview System
- **Persistent Right Panel**: Preview opens in dedicated right panel, not modal popup
- **Multi-Format Support**: Images, videos (with streaming), audio, text files, and metadata
- **Video Streaming**: Large video files use HTTP range requests for efficient streaming
- **Text Preview**: Code and text files with syntax highlighting and proper formatting
- **Metadata Display**: Comprehensive file information including GCS metadata and upload history

### Responsive Design
- Use `flex` layouts with proper sizing (`flex-1`, `w-80`, etc.)
- Implement proper overflow handling (`overflow-hidden`, `overflow-auto`)
- Ensure panels resize gracefully on different screen sizes

## GCS Integration Guidelines

### File Operations
- Use `@google-cloud/storage` for server-side operations
- All API routes protected with user authorization middleware
- Per-user bucket access validation on all operations
- Handle file uploads with proper error handling and progress indicators
- Upload metadata includes user information (uploadedBy, uploaderEmail)
- Implement bulk operations (multi-select, bulk download, bulk delete)
- Dynamic bucket lists based on user permissions

### Streaming Support
- **Video Streaming**: Implement HTTP range support in `/api/stream` endpoint
- **Authentication**: Support auth via both headers and query parameters for streaming
- **Large File Handling**: Use streaming for files > 100MB to improve performance
- **Progress Indicators**: Show loading states and buffering for large files

### File Preview API
- **Preview Endpoint**: `/api/preview` with content and metadata support
- **Multi-Type Support**: Handle different file types (image, video, audio, text, document)
- **Metadata Retrieval**: Include GCS metadata (timestamps, hashes, custom metadata)
- **Availability Checking**: Return `previewAvailable` flag for all file types

## Code Conventions

### Configuration File Standards
- **TypeScript Configuration**: Use `next.config.ts` (TypeScript) instead of `next.config.js`
- **Infrastructure as Code**: All GCP resources defined in Terraform, no bash scripts
- **Environment Variables**: Use `.env.local.example` as template, never commit actual secrets
- **Documentation**: Maintain organized docs/ directory with clear navigation

### TypeScript & React
- Use TypeScript strictly with proper type definitions
- Follow Next.js App Router patterns
- Implement proper error handling and loading states
- Follow React best practices for hooks and state management
- Use proper event handling patterns (prevent double-click events, etc.)

### Styling Guidelines
- Use Tailwind CSS for styling with responsive design
- **Text Visibility**: Always include explicit text colors for input fields and form elements
  - Use `text-gray-900` for dark, readable text
  - Use `placeholder-gray-500` for placeholder text
  - Use `bg-white` for consistent backgrounds
- **Color Contrast**: Ensure sufficient contrast for accessibility
- **Component Styling**: Use consistent spacing and border patterns

### Input Field Standards
```tsx
// Correct input styling with proper text visibility
<input
  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
/>

// Correct select styling
<select
  className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
>
```

### File Type Detection
- Implement comprehensive file type detection based on extensions
- Support categories: image, video, audio, text, document, other
- Use appropriate icons and preview methods for each type
- Handle edge cases and unknown file types gracefully

## API Routes Structure

### Public APIs
- `/api/auth/register` - User registration
- `/api/auth/init-profile` - Profile initialization for existing users

### Authenticated APIs (withAuth)
- `/api/user/profile` - User profile management
- `/api/allowed-buckets` - Get user's accessible buckets
- `/api/buckets` - List bucket contents (with user access check)
- `/api/upload` - File upload (with permission validation)
- `/api/download` - File download (with access check)
- `/api/delete` - File deletion (with permission check)
- `/api/stream` - File streaming (with auth via query param)
- `/api/preview` - File preview (with access validation)

### Admin APIs (withAdminAuth)
- `/api/admin/users` - User management (GET, PUT, DELETE)
- `/api/admin/permissions` - Permission management (GET, POST, DELETE)
- `/api/admin/buckets` - Bucket management (GET, POST)

## Component Architecture

### Main Application Components

#### FileManagerV2 (Main Layout)
- Three-panel flex layout with role-aware navigation
- State management for selected files and preview
- Coordination between file browser and preview panel
- Dynamic bucket selection based on user permissions

#### FilePreview (Right Panel)
- Persistent panel (not modal)
- Multi-format rendering with streaming support
- Comprehensive metadata display including upload history
- Proper error handling and loading states

#### FileBrowser (Center Panel)
- Table-based file listing with user-specific buckets
- Multi-select with keyboard shortcuts (Ctrl+A, Delete, Escape)
- Bulk operations (download, delete) with permission checks
- Drag-and-drop upload support
- Folder creation with proper input styling

#### UploadDialog
- Modal for file and folder uploads
- Drag-and-drop with visual feedback
- Folder structure preservation
- Destination path selection with user audit trail

### User Management Components

#### AdminDashboard
- Tabbed interface for user and bucket management
- Admin-only access with role verification
- Real-time updates and error handling

#### UserManagement
- User list with role management
- Per-user bucket permission assignment
- User deactivation and role changes
- Permission modal for bulk bucket access management

#### BucketManagement
- GCS bucket creation with validation
- Bucket listing with user access counts
- Integration with GCP for actual bucket provisioning

#### UserProfile
- User profile editing (display name, etc.)
- Permission viewing for current user
- Role-based information display
- Admin dashboard access for admin users

## Database Schema

### Collections

#### users
```typescript
{
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  bucketPermissions: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}
```

#### buckets
```typescript
{
  name: string;
  displayName: string;
  location: string;
  storageClass: string;
  createdBy: string;
  createdAt: string;
  description?: string;
  isActive: boolean;
  allowedUsers: string[];
}
```

#### permissions
```typescript
{
  userId: string;
  bucketName: string;
  permissions: ('read' | 'write' | 'delete')[];
  grantedBy: string;
  grantedAt: string;
}
```

#### auditLogs
```typescript
{
  id: string;
  userId: string;
  action: string;
  resourceType: 'bucket' | 'user' | 'permission';
  resourceId: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
}
```

## Security Considerations
- All API routes use Firebase ID token verification
- Role-based access control at both API and UI levels
- Per-user bucket permission validation
- Audit logging for all administrative actions
- User input validation and sanitization
- Secure file upload with metadata tracking
- Admin role protection (cannot demote self, deactivate self)
- Automatic user profile creation with safe defaults

## Performance Optimization
- Implement streaming for large files (>100MB)
- Use HTTP range requests for video playback
- Proper loading states and error handling
- Efficient file listing with pagination support
- Optimize bundle size and minimize re-renders

## Accessibility & UX
- Ensure proper keyboard navigation
- Implement ARIA labels and roles
- Maintain sufficient color contrast (especially for text inputs)
- Provide clear loading and error states
- Support screen readers and assistive technologies

## Current Authorization Features
- ✅ User-level bucket permissions and management
- ✅ Role-based access control (admin/user)
- ✅ Admin dashboard for user and bucket management
- ✅ User registration with automatic profile creation
- ✅ Per-user file upload tracking and metadata
- ✅ Audit logging for all permission changes
- ✅ Dynamic bucket access based on user permissions

## Future Features to Support
- Advanced file operations (copy, move, rename)
- Enhanced file preview (PDF, Office documents)
- File versioning and history
- Advanced search and filtering
- Thumbnail generation for images
- Automated GCP IAM service account management
- User activity dashboards and analytics
- Advanced audit log viewing and filtering

## Environment Variables Required

### Firebase Configuration
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (server-side only, base64 encoded)

### Google Cloud Configuration
- `GOOGLE_CLOUD_PROJECT_ID`
- `ALLOWED_BUCKETS` (deprecated - now managed through database)

### Database
- Firestore is automatically configured through Firebase project
- Collections: users, buckets, permissions, auditLogs

### Initial Admin Setup
- First registered user should be manually promoted to admin role in Firestore
- Alternatively, set up admin user through Firebase Admin SDK script

## Deployment Notes
- Configured for Google Cloud Run deployment
- Include proper Dockerfile and .dockerignore
- Set up environment variables in Cloud Run
- Configure IAM roles for GCS access
- Ensure streaming endpoints work with load balancers
- Set appropriate timeout values for large file operations

## Testing Considerations
- Test file uploads/downloads with various file sizes
- Verify streaming works with large video files
- Test authentication with expired tokens
- Verify proper error handling for network issues
- Test bulk operations with many files selected
- Ensure proper cleanup of object URLs and resources
- Test user registration and permission assignment
- Verify admin dashboard functionality
- Test role-based access control

## Documentation Organization
The project maintains clean, organized documentation:
- **Root README.md**: Project overview and quick local development
- **DEPLOYMENT.md**: Complete production deployment workflow
- **docs/**: Specialized setup guides and configuration instructions
- **terraform/README.md**: Infrastructure details and Terraform usage
- **No Duplication**: Each topic covered in exactly one place with clear cross-references