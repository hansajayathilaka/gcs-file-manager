# GCS File Manager

A Next.js application for managing Google Cloud Storage (GCS) buckets with Firebase authentication. This application allows users to view, upload, and delete files in configured GCS buckets.

## Features

- 🔐 **Firebase Authentication** - Email/password and Google OAuth sign-in
- 📁 **GCS Bucket Management** - List, upload, and delete files with folder support
- 🗂️ **Folder Navigation** - Create folders, navigate through directory structure
- 🧭 **Breadcrumb Navigation** - Easy navigation with breadcrumb trail
- � **File Browser UI** - Modern file explorer interface with sidebar and main content
- �🔧 **Environment-Based Configuration** - Allowed buckets configured via ALLOWED_BUCKETS environment variable
- � **Drag & Drop** - Drag and drop file uploads
- �🚀 **Cloud Run Ready** - Optimized for Google Cloud Run deployment
- 📱 **Responsive Design** - Modern UI with Tailwind CSS and Heroicons
- 🔒 **Secure** - Server-side authentication verification

## Quick Start

1. Clone and install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Configure your environment variables in `.env.local`:
   - Firebase configuration
   - Google Cloud project ID
   - Allowed GCS buckets
   - Service account key (base64 encoded)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Firebase Configuration
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

### Server-side Configuration
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Base64 encoded Firebase service account key
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project ID
- `ALLOWED_BUCKETS` - Comma-separated list of allowed GCS bucket names

## Documentation

- 📖 **[Deployment Guide](./DEPLOYMENT.md)** - Complete production deployment instructions
- 🏗️ **[Terraform Setup](./terraform/README.md)** - Infrastructure as Code configuration
- 🔧 **[GitHub Variables Setup](./docs/GITHUB_VARIABLES_SETUP.md)** - GitHub Actions configuration
- 🔐 **[GitHub Setup Guide](./docs/GITHUB_SETUP.md)** - Secrets and authentication setup

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Storage**: Google Cloud Storage with streaming support
- **Deployment**: Google Cloud Run with GitHub Actions
- **Infrastructure**: Terraform for automated provisioning

### Key Features
- 🖥️ **Three-Panel Layout** - Persistent file preview with streaming
- 📁 **Multi-Format Preview** - Images, videos, audio, text files
- 🎥 **Video Streaming** - HTTP range requests for large files
- 📱 **Responsive Design** - Modern UI with proper mobile support
- 🔒 **Security** - Workload Identity and proper authentication
- 🚀 **Performance** - Optimized for large files and efficient streaming

## Environment Variables

See `.env.local.example` for complete configuration. Key variables include:

### Firebase Configuration (Public)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... additional Firebase config
```

### Server Configuration (Private)
```env
FIREBASE_SERVICE_ACCOUNT_KEY=base64-encoded-service-account-json
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project
ALLOWED_BUCKETS=bucket1,bucket2,bucket3
NEXTAUTH_SECRET=your-secret-key
```

## Quick Local Development

1. **Clone and install dependencies:**
```bash
git clone https://github.com/your-username/FileManager.git
cd FileManager
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase and GCP configuration
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open http://localhost:3000**

## Production Deployment

For production deployment to Google Cloud Run with full infrastructure automation:

📖 **[Complete Deployment Guide](./DEPLOYMENT.md)** - Step-by-step production deployment

Key features:
- 🏗️ **Terraform Infrastructure** - Automated GCP resource provisioning
- 🚀 **GitHub Actions** - Continuous deployment pipeline
- 🔐 **Workload Identity** - Secure keyless authentication
- 📋 **Environment Management** - Multi-environment support
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   ├── buckets/    # Bucket listing
│   │   ├── upload/     # File upload
│   │   └── delete/     # File deletion
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main dashboard
├── components/         # React components
│   ├── LoginForm.tsx   # Authentication form
│   ├── BucketConfig.tsx # Bucket configuration
│   └── FileManager.tsx # Main file management interface
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── lib/               # Utility libraries
│   ├── firebase.ts    # Firebase client config
│   ├── firebase-admin.ts # Firebase admin config
│   └── gcs.ts         # Google Cloud Storage client
└── types/             # TypeScript type definitions
    └── index.ts       # Shared types
```

## Security Considerations

- Firebase service account key is only used server-side
- All API routes verify Firebase authentication tokens
- GCS operations are restricted to configured buckets only
- Input validation on all file operations
- CORS and security headers configured

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
