# GitHub Copilot Instructions for FileManager

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js application for managing Google Cloud Storage (GCS) buckets with Firebase authentication. The application is designed to be deployed on Google Cloud Run.

## Key Technologies
- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Storage**: Google Cloud Storage (GCS)
- **Deployment**: Google Cloud Run
- **State Management**: React hooks and context

## Project Structure
- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions, Firebase config, GCS clients
- `/src/types` - TypeScript type definitions
- `/src/hooks` - Custom React hooks

## Authentication Implementation
- Use Firebase Auth for user authentication
- Support email/password and Google OAuth sign-in
- Implement authentication context for state management
- Use middleware for protected routes

## GCS Integration Guidelines
- Use `@google-cloud/storage` for server-side operations
- Implement API routes for bucket operations (list, upload, delete)
- Handle file uploads with proper error handling and progress indicators
- Support multiple allowed buckets configuration

## Code Conventions
- Use TypeScript strictly with proper type definitions
- Follow Next.js App Router patterns
- Implement proper error handling and loading states
- Use Tailwind CSS for styling with responsive design
- Follow React best practices for hooks and state management

## Security Considerations
- Never expose GCS credentials in client-side code
- Use Firebase Admin SDK on server-side for authentication verification
- Implement proper CORS and security headers
- Validate all user inputs and file uploads

## Future Features to Support
- User-level bucket permissions and management
- Advanced file operations (copy, move, rename)
- Bulk operations and batch uploads
- File preview and metadata viewing
- User role-based access control

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
