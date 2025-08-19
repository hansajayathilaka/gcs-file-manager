# Secure Authentication Methods for Firebase Admin

## Overview

Instead of storing service account keys as environment variables, we use **Application Default Credentials (ADC)** which is the most secure approach for GCP services.

## 3 Secure Authentication Methods

### 1. **Application Default Credentials (ADC) - CURRENT IMPLEMENTATION**

✅ **Most Secure & Recommended**

**How it works:**
- Cloud Run service runs with an assigned service account
- Firebase Admin SDK automatically uses the service account's credentials
- No keys stored in environment variables or code

**Benefits:**
- 🔒 No service account keys in environment variables
- 🔄 Automatic credential rotation by Google
- 🎯 Fine-grained IAM permissions
- 📝 Full audit trail

### 2. **Workload Identity Federation**

✅ **Alternative for Cross-Cloud Authentication**

**Use case:** When you need to authenticate from outside GCP (e.g., on-premises, other clouds)

```typescript
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});
```

### 3. **Google Secret Manager (For Existing Keys)**

✅ **Better than Environment Variables**

If you must use service account keys, store them in Secret Manager:

```yaml
env:
- name: FIREBASE_SERVICE_ACCOUNT_KEY
  valueFrom:
    secretKeyRef:
      name: firebase-service-account-key
      key: latest
```

## Current Implementation Details

### Firebase Admin Configuration
```typescript
// OLD: Using service account key
const firebaseAdminConfig = {
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// NEW: Using Application Default Credentials  
const firebaseAdminConfig = {
  credential: applicationDefault(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
```

### Cloud Run Service Account
```yaml
# cloudrun-service.yaml
spec:
  template:
    spec:
      serviceAccountName: "filemanager-service@your-project.iam.gserviceaccount.com"
```

## Required Service Account Permissions

Your Cloud Run service account needs these IAM roles:

```bash
# Firebase Authentication
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:filemanager-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# Cloud Storage (for GCS buckets)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:filemanager-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Firestore (if used)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:filemanager-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

## Setup Instructions

### 1. Create Service Account
```bash
gcloud iam service-accounts create filemanager-service \
  --display-name="File Manager Cloud Run Service Account"
```

### 2. Grant Required Permissions
```bash
# Firebase Admin SDK
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:filemanager-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# Cloud Storage
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:filemanager-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### 3. Update GitHub Variables
Add to your GitHub repository variables:
```
CLOUD_RUN_SERVICE_ACCOUNT=filemanager-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 4. Remove Old Secrets
You can now remove these from GitHub Secrets:
- ❌ `FIREBASE_SERVICE_ACCOUNT_KEY` (no longer needed)

## Security Benefits

| Method | Security Level | Key Storage | Rotation | Audit Trail |
|--------|---------------|-------------|-----------|-------------|
| **ADC** | 🟢 Highest | None | Automatic | Full |
| Secret Manager | 🟡 High | Encrypted | Manual | Partial |
| Environment Variables | 🔴 Low | Plaintext | Manual | None |

## Troubleshooting

**"Default credentials not found"**
- Ensure service account is assigned to Cloud Run service
- Check service account has required IAM permissions
- Verify `serviceAccountName` in Cloud Run spec

**"Insufficient permissions"**
- Add required IAM roles to service account
- Check Firebase project IAM settings
- Verify GCS bucket permissions

**Local Development**
For local development, you still need credentials:
```bash
# Option 1: Application Default Credentials
gcloud auth application-default login

# Option 2: Service Account Key (local only)
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Migration from Service Account Keys

1. ✅ Update Firebase Admin config to use `applicationDefault()`
2. ✅ Create and configure service account with proper IAM roles
3. ✅ Update Cloud Run service spec with `serviceAccountName`
4. ✅ Remove `FIREBASE_SERVICE_ACCOUNT_KEY` from GitHub Secrets
5. ✅ Test deployment to ensure authentication works

This approach eliminates the security risk of storing service account keys while providing better credential management and automatic rotation.