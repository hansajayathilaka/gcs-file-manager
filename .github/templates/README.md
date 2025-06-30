# Deployment Templates

This directory contains template files used for deploying the FileManager application.

## Files

### `cloudrun-service.template.yaml`
Cloud Run service specification template used by the deployment workflow. This template:

- Defines the Cloud Run service configuration
- Sets up environment variables for the application
- Configures resource limits and health checks
- Uses variable substitution for deployment-specific values

The deployment workflow (`.github/workflows/deploy.yml`) processes this template with `envsubst` to generate the final Cloud Run service specification with actual values.

## Usage

These templates are automatically used by GitHub Actions workflows and don't need manual intervention. The workflow:

1. Reads the template file
2. Substitutes environment variables (like `${SERVICE_NAME}`, `${IMAGE_URL}`, etc.)
3. Generates the final deployment specification
4. Deploys to Google Cloud Run

## Variables Used

The template uses these variables (set by the deployment workflow):
- `SERVICE_NAME` - Cloud Run service name
- `IMAGE_URL` - Container image URL from Artifact Registry
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase admin credentials
- `GOOGLE_CLOUD_PROJECT_ID` - GCP project ID
- `ALLOWED_BUCKETS` - Bucket names from terraform output (space-separated for Cloud Run)
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - Application base URL
