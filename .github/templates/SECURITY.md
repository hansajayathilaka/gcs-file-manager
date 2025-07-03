# 🔒 Cloud Run Template Security Notice

## Template Safety

This template file (`cloudrun-service.template.yaml`) is **safe for public repositories** because:

✅ **Contains only placeholders**: `${VARIABLE_NAME}` format  
✅ **No real secrets**: All sensitive data substituted at deployment time  
✅ **Environment variables**: Populated from GitHub Variables/Secrets during workflow  

## How It Works

1. **Template stays in repo**: Contains only placeholder variables
2. **Workflow substitutes values**: Using `envsubst` command during deployment
3. **Temporary file created**: `service.yaml` with real values (immediately deleted)
4. **No secrets exposed**: Real configuration never committed to repository

## Template Variables

The following variables are substituted during deployment:

### Service Configuration
- `${SERVICE_NAME}` - Cloud Run service name
- `${IMAGE_URL}` - Docker image URL

### Firebase (Public Config)
- `${NEXT_PUBLIC_FIREBASE_API_KEY}`
- `${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`
- `${NEXT_PUBLIC_FIREBASE_PROJECT_ID}`
- `${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`
- `${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}`
- `${NEXT_PUBLIC_FIREBASE_APP_ID}`
- `${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`

### Server-side Configuration
- `${FIREBASE_SERVICE_ACCOUNT_KEY}` - Firebase admin credentials
- `${GOOGLE_CLOUD_PROJECT_ID}` - GCP project ID
- `${ALLOWED_BUCKETS}` - Comma-separated bucket names
- `${NEXTAUTH_SECRET}` - Authentication secret
- `${NEXTAUTH_URL}` - Application URL

All values come from GitHub Variables (public config) and GitHub Secrets (sensitive data).
