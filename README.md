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

### Authentication
- `NEXTAUTH_SECRET` - Secret for NextAuth (any random string)
- `NEXTAUTH_URL` - Base URL of your application

## Setup Instructions

### 1. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and configure sign-in providers:
   - Email/Password
   - Google OAuth
3. Generate service account key:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Base64 encode the JSON file content
4. Copy configuration values to `.env.local`

### 2. Google Cloud Setup

1. Create a GCP project or use existing one
2. Enable Cloud Storage API
3. Create GCS buckets that you want to manage
4. Set up IAM permissions:
   - Cloud Storage Admin role for the service account
   - Cloud Run Admin role for deployment

### 3. Cloud Run Deployment

1. Install Google Cloud SDK
2. Configure authentication:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

3. Build and deploy:
```bash
# For Linux/Mac
./deploy.sh YOUR_PROJECT_ID us-central1

# For Windows
deploy.bat YOUR_PROJECT_ID us-central1
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
