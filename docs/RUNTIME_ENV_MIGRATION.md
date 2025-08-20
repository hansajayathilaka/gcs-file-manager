# Runtime Environment Variables Migration

## Overview

The application has been migrated from **build-time** to **runtime** environment variables for improved security and flexibility.

## What Changed

### Before (Build-time Environment Variables)
```dockerfile
# Dockerfile - OLD WAY
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
RUN npm run build
```

### After (Runtime Environment Variables)
```dockerfile
# Dockerfile - NEW WAY  
# Build without environment variables - they'll be provided at runtime
RUN npm run build
```

## Benefits

### 🔒 Security
- **No secrets in Docker images**: Environment variables not baked into images
- **Audit trail**: Easier to track what configuration was used when
- **Immutable builds**: Same image can be deployed securely to different environments

### 🚀 Performance  
- **Faster builds**: No need to rebuild images for configuration changes
- **Lazy initialization**: Firebase/services initialize only when needed
- **Smaller images**: No embedded configuration data

### 🔄 Flexibility
- **Environment isolation**: Same image works for dev/staging/prod
- **Configuration updates**: Change environment variables without rebuilding
- **Multi-environment deployment**: One build, multiple configurations

## Technical Implementation

### 1. Lazy Firebase Initialization
```typescript
// OLD: Eager initialization at module load
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// NEW: Lazy initialization when needed
let app: FirebaseApp | null = null;
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const config = getPublicRuntimeConfig();
    app = initializeApp(config.firebase);
  }
  return app;
}
```

### 2. Runtime Configuration Utility
```typescript
// NEW: Centralized runtime config
export function getRuntimeConfig() {
  return {
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      // ... other config
    },
    // ... server config
  };
}
```

### 3. Updated Deployment Pipeline

**GitHub Actions - Before:**
```yaml
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="${{ secrets.FIREBASE_API_KEY }}" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="${{ vars.FIREBASE_PROJECT_ID }}" \
  # ... many build args
```

**GitHub Actions - After:**
```yaml
# Build without environment variables - they will be provided at runtime
docker build -t "image-name" ./
```

**Cloud Run Service - Unchanged:**
```yaml
# Runtime environment variables (same as before)
env:
- name: NEXT_PUBLIC_FIREBASE_API_KEY
  value: "FIREBASE_API_KEY_PLACEHOLDER"
- name: NEXT_PUBLIC_FIREBASE_PROJECT_ID  
  value: "FIREBASE_PROJECT_ID_PLACEHOLDER"
```

## Migration Impact

### ✅ What Still Works
- Existing deployment pipeline (with updated GitHub Actions)
- Same environment variable names and values
- Cloud Run service configuration
- Local development with `.env.local`

### 🔄 What Changed
- Docker build process (no longer needs environment variables)
- Firebase initialization (now lazy-loaded)
- Component imports (updated to use lazy getters)

### 🚫 Breaking Changes
- **None for end users**: Application functionality unchanged
- **Development**: Component code updated to use new Firebase imports

## Verification

### Test Build Success
```bash
# Build should work without any environment variables
docker build -t test-image .
echo "✅ Build successful without environment variables"
```

### Test Runtime Configuration
```bash
# Set runtime environment variables and test
docker run -e NEXT_PUBLIC_FIREBASE_API_KEY=test-key test-image
```

### Verify Lazy Loading
- Firebase services initialize only when first accessed
- No initialization errors during build process
- Environment variables read only at runtime

## Rollback Plan

If needed, rollback is possible by:
1. Reverting Dockerfile to include build-time environment variables
2. Reverting GitHub Actions to pass build arguments
3. Reverting Firebase initialization to eager loading

However, the new approach is recommended for all future deployments.

## Next Steps

### Immediate
- ✅ Updated deployment pipeline  
- ✅ Updated documentation
- ✅ Verified build process

### Future Enhancements
- Consider Google Secret Manager for sensitive variables
- Implement configuration validation at startup
- Add environment-specific health checks

## Conclusion

The migration to runtime environment variables provides better security, flexibility, and performance while maintaining full backward compatibility with existing deployment processes.