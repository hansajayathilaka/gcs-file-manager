# FileManager Deployment Guide

This guide covers deploying the FileManager application to Google Cloud Run using GitHub Actions with Terraform-managed infrastructure.

## 📚 Documentation Structure

This deployment guide provides the complete workflow. For specific topics, see:

- 🏗️ **[Terraform Configuration](./terraform/README.md)** - Infrastructure details and local development
- 🔧 **[GitHub Variables Setup](./docs/GITHUB_VARIABLES_SETUP.md)** - GitHub Actions variable configuration  
- 🔐 **[GitHub Setup Guide](./docs/GITHUB_SETUP.md)** - Secrets and authentication configuration

## Overview

The deployment process consists of two main workflows:

1. **Infrastructure Management** (`terraform.yml`) - Provisions GCP resources using Terraform
2. **Application Deployment** (`deploy.yml`) - Builds and deploys the application to Cloud Run

## Prerequisites

1. **Google Cloud Platform Account** with billing enabled
2. **GitHub Repository** with access to GitHub Actions
3. **Firebase Project** set up for authentication
4. **Terraform** installed locally (>= 1.0) - Optional for local development
5. **Google Cloud SDK** installed locally - Optional for local development

## Quick Start (GitHub Actions)

### 1. Fork and Clone Repository

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/FileManager.git
cd FileManager
```

### 2. Configure GitHub Repository Settings

**⚠️ Important: Configuration is Required**

All infrastructure settings must be explicitly configured. No hard-coded defaults are provided for security.

**Required: Set GitHub Variables** (`Settings > Secrets and variables > Actions > Variables`):
- **TERRAFORM_PROJECT_ID** - Your GCP project ID
- **TERRAFORM_REGION** - Your preferred GCP region
- **TERRAFORM_SERVICE_NAME** - Cloud Run service name
- **TERRAFORM_ARTIFACT_REGISTRY_REPO** - Docker repository name
- **TERRAFORM_STORAGE_BUCKETS** - Comma-separated bucket names (must be globally unique)
- **TERRAFORM_ENVIRONMENT** - Environment: dev, staging, or prod
- **TERRAFORM_ENABLE_WORKLOAD_IDENTITY** - true (recommended) or false
- **TERRAFORM_GITHUB_REPO** - Your GitHub repository (owner/repo format)

See [GitHub Variables Setup Guide](./docs/GITHUB_VARIABLES_SETUP.md) for detailed instructions.

**Repository Secrets** (`Settings > Secrets and variables > Actions > Secrets`):
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Your Firebase service account key (JSON)
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- Others will be added after running Terraform

### 3. Run Infrastructure Provisioning

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Terraform Infrastructure Management** workflow
4. Click **Run workflow**
5. **Either:**
   - **Use GitHub Variables** (if you set them up in step 2) - leave inputs empty
   - **Provide Manual Input** - fill in all the required fields:
     - **Action**: `apply`
     - **Project ID**: Your GCP project ID
     - **Region**: Your preferred region
     - **Service Name**: Cloud Run service name
     - **Artifact Registry Repo**: Docker repository name
     - **Storage Buckets**: Comma-separated unique bucket names
     - **Environment**: dev, staging, or prod
     - **GitHub Repository**: Your repo in format `username/FileManager`
     - **Enable Workload Identity**: `true` (recommended)
6. Click **Run workflow**

**⚠️ The workflow will fail with clear error messages if any required configuration is missing.**

### 4. Configure GitHub Secrets and Variables

After the Terraform workflow completes successfully:

1. Check the workflow output for configuration values
2. Go to **Settings > Secrets and variables > Actions**
3. Add the **Variables** shown in the Terraform output
4. Add the **Secrets** shown in the Terraform output

### 5. Deploy Application

1. Push code changes to the `main` or `master` branch, OR
2. Go to **Actions** > **Deploy to Google Cloud Run** > **Run workflow**

The deployment will automatically:
- Check if infrastructure exists
- Build and test the application
- Deploy to Cloud Run
- Run health checks

## Local Development Setup (Optional)

If you want to manage infrastructure locally:

### 1. Install Required Tools

```bash
# Install Terraform
# macOS: brew install terraform
# Windows: choco install terraform
# Linux: Download from https://www.terraform.io/downloads

# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR-PROJECT-ID
```

### 2. Configure Terraform Locally

```bash
# Navigate to terraform directory
cd terraform

# Copy and edit the configuration file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
```

**Required terraform.tfvars configuration:**
```hcl
# ALL VALUES ARE REQUIRED - Replace with your actual values

project_id = "YOUR-PROJECT-ID"              # Your actual GCP project ID
region = "us-central1"                      # Your preferred region
service_name = "filemanager"                # Your service name
artifact_registry_repo = "filemanager-repo" # Your repository name
environment = "prod"                        # dev, staging, or prod

# Storage buckets - must be globally unique across all of GCP
storage_buckets = [
  "YOUR-UNIQUE-BUCKET-1",      # Replace with your unique bucket names
  "YOUR-UNIQUE-BUCKET-2", 
  "YOUR-UNIQUE-BUCKET-3"
]

github_repo = "your-username/FileManager"   # Your GitHub repository
enable_workload_identity = true            # Recommended for security
```

**⚠️ Important Notes:**
- Replace ALL placeholder values with your actual values
- Storage bucket names must be globally unique across all of Google Cloud
- No defaults are provided to prevent accidental deployments

### 3. Deploy Infrastructure Locally

```bash
# Initialize Terraform
npm run terraform:init

# Review what will be created
npm run terraform:plan

# Deploy the infrastructure
npm run terraform:apply
```

### 4. Get Configuration Values

```bash
# Get all output values
npm run terraform:output

# Get specific outputs
terraform output github_variables
terraform output github_secrets_workload_identity
```

#### For Service Account Key (Less Secure):
If you set `enable_workload_identity = false`:

| Secret Name | Source |
|-------------|--------|
| `GCP_SERVICE_ACCOUNT_KEY` | From `terraform output service_account_key` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | From your .env.local file |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |

### Required GitHub Variables  
Add these to your GitHub repository (`Settings > Secrets and variables > Actions > Variables`):

Use the values from `terraform output github_variables`:

| Variable Name | Source |
|---------------|--------|
| `GCP_PROJECT_ID` | From terraform output |
| `GCP_REGION` | From terraform output |
| `CLOUD_RUN_SERVICE_NAME` | From terraform output |
| `ARTIFACT_REGISTRY_REPO` | From terraform output |
| `ALLOWED_BUCKETS` | From terraform output |
| `NEXTAUTH_URL` | From terraform output |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From your .env.local |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From your .env.local |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From your .env.local |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From your .env.local |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From your .env.local |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From your .env.local |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | From your .env.local |

## Deployment Process

### Automatic Deployment

The deployment happens automatically when you:

1. **Push to main/master branch** - Triggers build, test, and deployment
2. **Create a pull request** - Triggers build and test only
3. **Manual trigger** - Use the "Run workflow" button in GitHub Actions

### Deployment Steps

The GitHub Actions workflow performs these steps:

1. **Build and Test Job**:
   - Checkout code
   - Setup Node.js environment
   - Install dependencies
   - Run linting and type checking
   - Build the application

2. **Deploy Job** (only on main/master):
   - Authenticate to Google Cloud (Workload Identity or Service Account Key)
   - Build Docker image
   - Push image to Artifact Registry
   - Generate Cloud Run service specification
   - Deploy to Cloud Run
   - Test the deployment

3. **Notify Job**:
   - Report deployment status

## Configuration Files Created

The deployment setup creates these files:

1. **`terraform/`** - Complete Terraform infrastructure configuration
2. **`.github/workflows/deploy.yml`** - GitHub Actions workflow with Workload Identity support
3. **`.github/templates/cloudrun-service.template.yaml`** - Cloud Run service specification template
4. **`src/app/api/health/route.ts`** - Health check endpoint
5. **`next.config.ts`** - Next.js configuration with standalone output

## Security Features

### Workload Identity (Recommended)
- **Keyless authentication**: No service account keys to store or rotate
- **Short-lived tokens**: Automatic token refresh
- **Repository-specific**: Only your GitHub repository can authenticate
- **Principle of least privilege**: Minimal required permissions

### Infrastructure Security
- **Uniform bucket-level access** on all storage buckets
- **Versioning enabled** for file safety
- **Lifecycle prevention** to avoid accidental resource deletion
- **IAM roles** with minimal required permissions

## Monitoring and Troubleshooting

### Check Deployment Status

```bash
# View Terraform state
npm run terraform:output

# Check Cloud Run service status
gcloud run services describe filemanager --region=us-central1

# View service logs
gcloud logs read --service=filemanager --limit=50
```

### Health Check

The application includes a health check endpoint at `/api/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-06-30T10:00:00.000Z",
  "service": "filemanager",
  "environment": "production"
}
```

## Quick Start Checklist

- [ ] Install Terraform and Google Cloud SDK
- [ ] Authenticate with Google Cloud: `gcloud auth application-default login`
- [ ] Configure `terraform/terraform.tfvars` with your GitHub repository
- [ ] Deploy infrastructure: `npm run terraform:apply`
- [ ] Add GitHub Secrets (WIF_PROVIDER, WIF_SERVICE_ACCOUNT, etc.)
- [ ] Add GitHub Variables (use terraform output values)
- [ ] Add Firebase environment variables to GitHub Variables
- [ ] Push to main branch to trigger deployment
- [ ] Check GitHub Actions for deployment status
- [ ] Test the deployed application

## Infrastructure Management

### Updating Infrastructure

```bash
# Make changes to terraform files
# Then apply updates
npm run terraform:apply
```

### Adding New Storage Buckets

Edit `terraform/terraform.tfvars`:
```hcl
storage_buckets = [
  "my-sample-bucket-1",
  "my-sample-bucket-2", 
  "another-bucket",
  "home-00-thamindu-storage",
  "new-bucket-name"  # Add new buckets here
]
```

Then run: `npm run terraform:apply`

### Viewing Current Infrastructure

```bash
# List all resources
terraform state list

# Show specific resource
terraform state show google_cloud_run_service.filemanager

# Get all outputs
npm run terraform:output
```

## Cost Optimization

- **Cloud Run**: Pay-per-use, scales to zero when not in use
- **Artifact Registry**: ~$0.10/GB/month for image storage
- **Cloud Storage**: ~$0.02/GB/month for standard storage
- **Terraform State**: Stored locally (free)

**Estimated monthly cost**: < $5 for typical usage

## Migration and Cleanup

### Destroying Infrastructure

⚠️ **Warning**: This will delete all resources except storage buckets (protected by lifecycle rules)

```bash
npm run terraform:destroy
```

### Backup Important Data

Before any major changes:
1. Export Cloud Storage bucket contents
2. Backup Firebase configuration
3. Save Terraform state file
