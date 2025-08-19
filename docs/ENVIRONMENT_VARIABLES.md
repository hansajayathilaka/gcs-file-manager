# Environment Variables Setup for Cloud Run Deployment

## Overview

Your application uses environment variables from `.env.local` file for local development. For Cloud Run deployment, these variables are provided through:

1. **GitHub Variables** (for non-sensitive data)
2. **GitHub Secrets** (for sensitive data like API keys)
3. **Cloud Run environment variables** (injected at runtime)

## Required GitHub Variables

Set these at: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/variables/actions`

```
# Infrastructure
GCP_PROJECT_ID=your-gcp-project-id
GAR_LOCATION=us-central1
GAR_REPOSITORY=your-artifact-registry-repo
CLOUD_RUN_SERVICE=filemanager
CLOUD_RUN_REGION=us-central1

# Firebase Configuration (Public)
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# Application Configuration
NEXTAUTH_URL=https://your-domain.com
CLOUD_RUN_SERVICE_ACCOUNT=filemanager-service@your-project.iam.gserviceaccount.com
```

## Required GitHub Secrets

Set these at: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

```
# Authentication
WIF_PROVIDER=projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider
WIF_SERVICE_ACCOUNT=github-actions@your-project.iam.gserviceaccount.com

# Firebase (Sensitive - API Key only)
FIREBASE_API_KEY=your-firebase-api-key

# Application Secrets  
NEXTAUTH_SECRET=your-secure-random-string
```

## How Environment Variables are Provided

### Option 1: GitHub Variables/Secrets (Current Implementation)
- Variables are stored in GitHub repository settings
- Pipeline substitutes placeholders in `cloudrun-service.yaml`
- Environment variables are baked into the Cloud Run service specification

### Option 2: Cloud Run Environment Variables (Alternative)
You can also set environment variables directly in Cloud Run:

```bash
gcloud run services update YOUR_SERVICE \
  --region=us-central1 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=your-project-id"
```

### Option 3: Google Secret Manager (Recommended for Production)
For production environments, consider using Google Secret Manager:

```yaml
env:
- name: FIREBASE_SERVICE_ACCOUNT_KEY
  valueFrom:
    secretKeyRef:
      name: firebase-service-account
      key: key
```

## Environment Variable Priority

1. **Cloud Run service specification** (highest priority)
2. **Container environment variables**
3. **Default values in code**

## Security Best Practices

✅ **Store sensitive data in GitHub Secrets**
- API keys
- Service account keys
- Authentication secrets

✅ **Use GitHub Variables for non-sensitive data**
- Project IDs
- Public configuration
- Domain names

✅ **Never commit `.env.local` to repository**
- Already in `.gitignore`
- Contains sensitive local development data

## Local Development vs Production

| Environment | Source | Usage |
|-------------|--------|-------|
| Local | `.env.local` | Next.js automatically loads |
| Cloud Run | Service Spec | Injected at container startup |
| CI/CD | GitHub Variables/Secrets | Substituted during deployment |

## Troubleshooting

**Missing Environment Variables:**
1. Check GitHub Variables/Secrets are set correctly
2. Verify placeholder names match in `cloudrun-service.yaml`
3. Check substitution logic in GitHub Actions workflow

**Authentication Issues:**
1. Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is base64 encoded
2. Verify Workload Identity Federation is configured
3. Check service account permissions