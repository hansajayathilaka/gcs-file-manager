# 🚀 Quick Setup Guide for New GCP Projects

This guide will help you deploy the FileManager application to a **new GCP project** with just a few commands. Everything is automated - just set the project ID and authentication, then the pipeline handles the rest.

## 🎯 One-Command Setup

### Prerequisites

1. **Install required tools:**
   ```bash
   # Install Terraform
   # Download from: https://terraform.io/downloads
   
   # Install Google Cloud CLI
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with Google Cloud:**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Create or select a GCP project:**
   ```bash
   # Create new project (optional)
   gcloud projects create your-unique-project-id
   
   # Set current project
   gcloud config set project your-project-id
   
   # Enable billing (required)
   # Go to: https://console.cloud.google.com/billing
   ```

### 🚀 Bootstrap Command

**Optional: Validate your setup first**
```bash
# Check if everything is ready
./validate-setup.sh
```

Run **ONE** command to set up everything:

```bash
# For Linux/Mac
cd terraform
./bootstrap.sh

# For Windows (PowerShell)
cd terraform
.\bootstrap.ps1
```

This script will:
- ✅ Create GCS bucket for Terraform state
- ✅ Initialize Terraform with remote backend
- ✅ Generate terraform.tfvars with your project
- ✅ Deploy all infrastructure
- ✅ Show GitHub configuration values

### 📋 What the Bootstrap Does

1. **Verifies Prerequisites** - Checks Terraform and gcloud installation
2. **Project Configuration** - Uses your current gcloud project or asks for input
3. **State Management** - Creates `{project-id}-terraform-state` GCS bucket
4. **Infrastructure Deployment** - Runs `terraform apply` with all resources
5. **GitHub Integration** - Provides copy-paste values for GitHub Variables/Secrets

## 🔧 GitHub Actions Setup

After bootstrap completes, configure GitHub:

### 1. GitHub Variables
Go to: **Settings > Secrets and variables > Actions > Variables**

The bootstrap script outputs all values - just copy and paste:
```bash
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
CLOUD_RUN_SERVICE_NAME=filemanager
ARTIFACT_REGISTRY_REPO=filemanager-repo
ALLOWED_BUCKETS=bucket1,bucket2,bucket3
NEXTAUTH_URL=https://your-service-url
# ... and more Firebase variables
```

### 2. GitHub Secrets
Go to: **Settings > Secrets and variables > Actions > Secrets**

**Workload Identity (Recommended):**
```bash
WIF_PROVIDER=projects/123456789/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
WIF_SERVICE_ACCOUNT=github-actions-sa@your-project.iam.gserviceaccount.com
```

**Additional secrets:**
```bash
FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-service-account-key
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

## 🎉 That's It!

Once GitHub is configured:

1. **Commit and push** your changes
2. **GitHub Actions automatically deploy** any future changes
3. **No more manual Terraform commands** needed

## 🛠️ Manual Process (Alternative)

If you prefer manual control:

```bash
cd terraform

# 1. Create terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
# Edit with your values

# 2. Create state bucket manually
gsutil mb -p your-project-id gs://your-project-id-terraform-state
gsutil versioning set on gs://your-project-id-terraform-state

# 3. Initialize Terraform
terraform init \
  -backend-config="bucket=your-project-id-terraform-state" \
  -backend-config="prefix=terraform/state"

# 4. Deploy infrastructure
terraform plan
terraform apply

# 5. Get GitHub configuration
terraform output github_variables
terraform output github_secrets_workload_identity
```

## 🔄 Day-2 Operations

### Updating Infrastructure
- **Via GitHub Actions**: Push changes to trigger automatic deployment
- **Locally**: `terraform plan && terraform apply` (state is shared via GCS)

### Adding New Buckets
1. Update `storage_buckets` in terraform.tfvars
2. Run `terraform apply` or push to GitHub

### State Management
- **State Location**: `gs://{project-id}-terraform-state/terraform/state/`
- **Version Control**: GCS versioning enabled for rollback capability
- **Shared Access**: All team members use the same state

## 🚨 Troubleshooting

### Bootstrap Fails
```bash
# Check authentication
gcloud auth list
gcloud projects list

# Check billing
gcloud billing projects describe your-project-id

# Check APIs (if needed)
gcloud services enable cloudresourcemanager.googleapis.com
```

### State Issues
```bash
# Reinitialize if backend changes
terraform init -reconfigure

# View current state
terraform state list

# Import existing resources (if needed)
terraform import google_storage_bucket.example bucket-name
```

### GitHub Actions Fails
1. Check all GitHub Variables are set correctly
2. Verify GitHub Secrets (especially authentication)
3. Ensure billing is enabled in GCP project
4. Check the exact error in Actions logs

## 📚 Additional Resources

- **Infrastructure Details**: `terraform/README.md`
- **GitHub Configuration**: `docs/GITHUB_VARIABLES_SETUP.md`  
- **Troubleshooting**: `docs/GITHUB_SETUP.md`
- **Project Overview**: `README.md`

---

**🎯 Goal**: Deploy to new GCP project with minimal manual steps. The bootstrap script handles everything automatically!
