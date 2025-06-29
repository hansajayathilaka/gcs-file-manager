# Cloud Run Environment Variables Setup

## Required Environment Variables

### Firebase Configuration (Public)
```bash
# Get these from Firebase Console > Project Settings > General
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Firebase Admin (Server-side, Secret)
```bash
# Base64 encoded service account key JSON
FIREBASE_SERVICE_ACCOUNT_KEY=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsC...
```

### Google Cloud Configuration (Secret)
```bash
# Your GCP Project ID
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id

# Comma-separated list of allowed GCS bucket names
ALLOWED_BUCKETS=bucket1,bucket2,bucket3
```

### Authentication (Secret)
```bash
# Random secret string for NextAuth
NEXTAUTH_SECRET=your-random-secret-key-here

# Base URL of your deployed application
NEXTAUTH_URL=https://your-app-url.run.app
```

## Setting Environment Variables in Cloud Run

### Using gcloud CLI:
```bash
gcloud run services update gcs-file-manager \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key,GOOGLE_CLOUD_PROJECT_ID=your-project" \
  --region=us-central1
```

### Using Cloud Console:
1. Go to Cloud Run in Google Cloud Console
2. Select your service
3. Click "Edit & Deploy New Revision"
4. Go to "Variables & Secrets" tab
5. Add environment variables

## Service Account Setup

1. Create a service account in GCP Console
2. Grant these IAM roles:
   - Storage Admin (for GCS operations)
   - Cloud Run Service Agent (for deployment)
3. Generate and download the JSON key
4. Base64 encode the JSON: `base64 -i service-account.json`
5. Use the encoded string as FIREBASE_SERVICE_ACCOUNT_KEY

## Firebase Service Account

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Base64 encode the downloaded JSON file
4. Use as FIREBASE_SERVICE_ACCOUNT_KEY environment variable
