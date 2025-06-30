# GitHub Copilot Instructions for FileManager

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js application for managing Google Cloud Storage (GCS) buckets with Firebase authentication. The application features a modern three-panel layout with a persistent file preview system, streaming video support, and comprehensive file management capabilities. The project uses Infrastructure as Code (Terraform) for automated deployment to Google Cloud Run with GitHub Actions.

## Key Technologies
- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom responsive design patterns
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Storage**: Google Cloud Storage (GCS) with streaming support
- **File Preview**: Multi-format preview with streaming for large videos
- **Infrastructure**: Terraform for automated GCP resource provisioning
- **Deployment**: Google Cloud Run with GitHub Actions CI/CD
- **Security**: Workload Identity for keyless authentication
- **State Management**: React hooks and context

## Performance Optimization
- Implement streaming for large files (>100MB)
- Use HTTP range requests for video playbook
- Proper loading states and error handling
- Efficient file listing with pagination support
- Optimize bundle size and minimize re-renders
- **Infrastructure Efficiency**: Auto-scaling Cloud Run with appropriate resource limits

## Deployment & Infrastructure

### Terraform Workflow
- Use `terraform.yml` GitHub Actions workflow for infrastructure changes
- All GCP resources defined in `/terraform` directory with proper variables
- Support for multiple environments (dev, staging, prod)
- Automated state management and drift detection

### GitHub Actions Configuration
- **Required GitHub Variables**: All infrastructure settings must be explicitly configured
- **Secrets Management**: Use Workload Identity when possible, service account keys as fallback
- **Validation**: Workflows fail fast with clear error messages if configuration is missing
- **Documentation**: Comprehensive setup guides in `/docs` directory

### Environment Variables Structure
```bash
# Terraform Variables (GitHub Variables)
TERRAFORM_PROJECT_ID=your-gcp-project
TERRAFORM_REGION=us-central1
TERRAFORM_STORAGE_BUCKETS=bucket1,bucket2,bucket3
TERRAFORM_ENABLE_WORKLOAD_IDENTITY=true

# Application Variables (Runtime)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
FIREBASE_SERVICE_ACCOUNT_KEY=base64-encoded-key
ALLOWED_BUCKETS=bucket1,bucket2,bucket3
```-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js application for managing Google Cloud Storage (GCS) buckets with Firebase authentication. The application features a modern three-panel layout with a persistent file preview system, streaming video support, and comprehensive file management capabilities. The project uses Infrastructure as Code (Terraform) for automated deployment to Google Cloud Run with GitHub Actions.

## Key Technologies
- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS with custom responsive design patterns
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Storage**: Google Cloud Storage (GCS) with streaming support
- **File Preview**: Multi-format preview with streaming for large videos
- **Infrastructure**: Terraform for automated GCP resource provisioning
- **Deployment**: Google Cloud Run with GitHub Actions CI/CD
- **Security**: Workload Identity for keyless authentication
- **State Management**: React hooks and context

## Project Structure
- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable React components
  - `FileManagerV2.tsx` - Main three-panel layout component
  - `FilePreview.tsx` - Right-panel file preview with streaming support
  - `FileBrowser.tsx` - File listing and management
  - `UploadDialog.tsx` - File/folder upload with drag-and-drop
  - `LoginForm.tsx` - Authentication forms
- `/src/lib` - Utility functions, Firebase config, GCS clients
- `/src/types` - TypeScript type definitions
- `/src/hooks` - Custom React hooks
- `/src/app/api` - API routes for file operations and streaming
- `/terraform` - Infrastructure as Code configuration
- `/docs` - Organized documentation (setup guides, GitHub configuration)
- `/.github/workflows` - CI/CD workflows for infrastructure and deployment

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
- **Left Panel**: Sidebar for navigation and bucket selection
- **Center Panel**: Main file browser with table view and bulk operations
- **Right Panel**: Persistent file preview panel (not modal)

### File Preview System
- **Persistent Right Panel**: Preview opens in dedicated right panel, not modal popup
- **Multi-Format Support**: Images, videos (with streaming), audio, text files, and metadata
- **Video Streaming**: Large video files use HTTP range requests for efficient streaming
- **Text Preview**: Code and text files with syntax highlighting and proper formatting
- **Metadata Display**: Comprehensive file information including GCS metadata

### Responsive Design
- Use `flex` layouts with proper sizing (`flex-1`, `w-80`, etc.)
- Implement proper overflow handling (`overflow-hidden`, `overflow-auto`)
- Ensure panels resize gracefully on different screen sizes

## Authentication Implementation
- Use Firebase Auth for user authentication
- Support email/password and Google OAuth sign-in
- Implement authentication context for state management
- Use middleware for protected routes
- Include auth tokens in API requests via headers and query parameters

## GCS Integration Guidelines

### File Operations
- Use `@google-cloud/storage` for server-side operations
- Implement API routes for bucket operations (list, upload, delete)
- Handle file uploads with proper error handling and progress indicators
- Support multiple allowed buckets configuration
- Implement bulk operations (multi-select, bulk download, bulk delete)

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

## API Patterns

### Authentication
- Use Firebase ID tokens for API authentication
- Support auth in both headers (`Authorization: Bearer <token>`) and query params (`?token=<token>`)
- Implement proper error handling for authentication failures

### Streaming Endpoints
```typescript
// Streaming endpoint pattern
export async function GET(request: NextRequest) {
  // Parse range headers for partial content
  const range = request.headers.get('range');
  
  // Support auth via header or query param
  const authHeader = request.headers.get('authorization');
  const tokenParam = url.searchParams.get('token');
  
  // Return appropriate status codes (206 for partial content, 416 for invalid range)
  return new Response(stream, {
    status: rangeRequest ? 206 : 200,
    headers: responseHeaders
  });
}
```

### Preview API Pattern
```typescript
// Preview API response structure
{
  success: boolean;
  previewAvailable: boolean;
  content?: string;        // For text files
  downloadUrl?: string;    // For binary files
  metadata?: object;       // GCS metadata
  error?: string;
}
```

## Component Architecture

### FileManagerV2 (Main Layout)
- Three-panel flex layout
- State management for selected files and preview
- Coordination between file browser and preview panel

### FilePreview (Right Panel)
- Persistent panel (not modal)
- Multi-format rendering with streaming support
- Comprehensive metadata display
- Proper error handling and loading states

### FileBrowser (Center Panel)
- Table-based file listing
- Multi-select with keyboard shortcuts (Ctrl+A, Delete, Escape)
- Bulk operations (download, delete)
- Drag-and-drop upload support
- Folder creation with proper input styling

### UploadDialog
- Modal for file and folder uploads
- Drag-and-drop with visual feedback
- Folder structure preservation
- Destination path selection

## Security Considerations
- Never expose GCS credentials in client-side code
- Use Firebase Admin SDK on server-side for authentication verification
- Implement proper CORS and security headers
- Validate all user inputs and file uploads
- Use secure streaming with authentication for sensitive files

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

## Future Features to Support
- User-level bucket permissions and management
- Advanced file operations (copy, move, rename)
- Bulk operations and batch uploads
- Enhanced file preview (PDF, Office documents)
- User role-based access control
- File versioning and history
- Advanced search and filtering
- Thumbnail generation for images

## Environment Variables Required
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (server-side only)
- `GOOGLE_CLOUD_PROJECT_ID`
- `ALLOWED_BUCKETS` (comma-separated list)

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

## Documentation Organization
The project maintains clean, organized documentation:
- **Root README.md**: Project overview and quick local development
- **DEPLOYMENT.md**: Complete production deployment workflow
- **docs/**: Specialized setup guides and configuration instructions
- **terraform/README.md**: Infrastructure details and Terraform usage
- **No Duplication**: Each topic covered in exactly one place with clear cross-references
