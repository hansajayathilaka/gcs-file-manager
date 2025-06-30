# GCS File Manager

A modern Next.js application for managing Google Cloud Storage (GCS) buckets with Firebase authentication. Features a three-panel layout with persistent file preview, streaming video support, and comprehensive file management capabilities.

## ✨ Features

- 🔐 **Firebase Authentication** - Email/password and Google OAuth sign-in
- 📁 **GCS Bucket Management** - List, upload, delete files with folder support
- 🗂️ **Three-Panel Layout** - Persistent file preview (not modal popup)
- 🎥 **Video Streaming** - HTTP range requests for large video files
- 📱 **Multi-Format Preview** - Images, videos, audio, text files, metadata
- 🧭 **Folder Navigation** - Create folders, breadcrumb navigation
- 🚀 **Cloud Run Ready** - Optimized for Google Cloud Run deployment
- � **Bulk Operations** - Multi-select, bulk download, bulk delete
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 🔒 **Secure** - Workload Identity and proper authentication

## 🚀 Quick Start

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

4. **Open [http://localhost:3000](http://localhost:3000)**

## 📚 Documentation

- � **[Deployment Guide](./DEPLOYMENT.md)** - Complete production deployment workflow
- 🏗️ **[Terraform Setup](./terraform/README.md)** - Infrastructure as Code configuration
- 🔧 **[GitHub Variables Setup](./docs/GITHUB_VARIABLES_SETUP.md)** - GitHub Actions configuration
- 🔐 **[GitHub Setup Guide](./docs/GITHUB_SETUP.md)** - Authentication and secrets setup
- 📖 **[All Documentation](./docs/README.md)** - Documentation overview and navigation

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS with responsive design
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Storage**: Google Cloud Storage with streaming support
- **Infrastructure**: Terraform for automated GCP provisioning
- **Deployment**: Google Cloud Run with GitHub Actions CI/CD
- **Security**: Workload Identity for keyless authentication

### Key Components
- 🖥️ **FileManagerV2** - Main three-panel layout component
- 📁 **FileBrowser** - File listing with bulk operations
- 🎞️ **FilePreview** - Persistent right-panel preview with streaming
- � **UploadDialog** - Drag-and-drop file/folder uploads
- � **LoginForm** - Authentication with multiple providers

## ⚙️ Environment Variables

### Firebase Configuration (Public)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Server Configuration (Private)
```env
FIREBASE_SERVICE_ACCOUNT_KEY=base64-encoded-service-account-json
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project
ALLOWED_BUCKETS=bucket1,bucket2,bucket3
NEXTAUTH_SECRET=your-secret-key
```

See `.env.local.example` for complete configuration template.

## 🚀 Production Deployment

For production deployment with full infrastructure automation:

**📖 [Complete Deployment Guide](./DEPLOYMENT.md)** - Step-by-step production setup

Key features:
- 🏗️ **Terraform Infrastructure** - Automated GCP resource provisioning
- 🔄 **GitHub Actions** - Continuous deployment pipeline
- 🔐 **Workload Identity** - Secure keyless authentication
- 📋 **Multi-Environment** - Support for dev, staging, production
## � Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── api/              # API routes
│   │   ├── buckets/      # Bucket listing
│   │   ├── upload/       # File upload
│   │   ├── delete/       # File deletion
│   │   ├── stream/       # Video streaming
│   │   └── preview/      # File preview
│   ├── layout.tsx        # Root layout with auth context
│   └── page.tsx          # Main dashboard
├── components/           # React components
│   ├── FileManagerV2.tsx # Main three-panel layout
│   ├── FilePreview.tsx   # Right-panel file preview
│   ├── FileBrowser.tsx   # File listing and management
│   ├── UploadDialog.tsx  # File/folder upload modal
│   └── LoginForm.tsx     # Authentication form
├── lib/                  # Utility libraries
│   ├── firebase.ts       # Firebase client config
│   ├── firebase-admin.ts # Firebase admin config
│   └── gcs.ts            # Google Cloud Storage client
├── types/               # TypeScript definitions
│   └── index.ts         # Shared types
└── hooks/               # Custom React hooks
    └── useAuth.ts       # Authentication hook
```

## 🔒 Security Features

- Firebase service account key is only used server-side
- All API routes verify Firebase authentication tokens
- GCS operations restricted to configured buckets only
- Input validation on all file operations
- CORS and security headers configured
- Workload Identity for keyless GitHub Actions authentication

## 🛠️ Development

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

# Validate configuration
npm run validate

# Access documentation
npm run docs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Run tests and linting (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
