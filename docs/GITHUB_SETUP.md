# GitHub Setup Guide for FileManager

Complete guide for configuring GitHub Actions authentication and variables for automated infrastructure and deployment.

## 🚀 Quick Setup Overview

### 1. Bootstrap Authentication (Required First)
Choose one method to provide initial authentication for Terraform:

#### **Method A: Local Setup (Easiest)**
```bash
# Authenticate locally and run Terraform first
gcloud auth login
gcloud auth application-default login
cd terraform
terraform init && terraform apply
```

#### **Method B: Bootstrap Service Account (GitHub Actions)**
```bash
# Create temporary service account
gcloud iam service-accounts create terraform-bootstrap \
  --description="Bootstrap account for initial Terraform run"

gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member="serviceAccount:terraform-bootstrap@YOUR-PROJECT-ID.iam.gserviceaccount.com" \
  --role="roles/editor"

gcloud iam service-accounts keys create bootstrap-key.json \
  --iam-account=terraform-bootstrap@YOUR-PROJECT-ID.iam.gserviceaccount.com

# Base64 encode for GitHub Secrets
base64 -i bootstrap-key.json | tr -d '\n'
```

### 2. Run Terraform Infrastructure
- GitHub Actions → "Terraform Infrastructure Management" 
- Action: `apply`
- Get outputs for configuration

### 3. Configure GitHub Authentication

#### **Workload Identity (Recommended - More Secure)**
Add these GitHub Secrets from `terraform output`:
```
WIF_PROVIDER                    # From terraform output
WIF_SERVICE_ACCOUNT            # From terraform output  
FIREBASE_SERVICE_ACCOUNT_KEY    # Base64 encoded from .env.local 
NEXTAUTH_SECRET                 # Generate: openssl rand -base64 32
```

#### **Service Account Key (Alternative)**
Add these GitHub Secrets:
```
GCP_SERVICE_ACCOUNT_KEY         # Base64 encoded service account key
FIREBASE_SERVICE_ACCOUNT_KEY    # Base64 encoded from .env.local 
NEXTAUTH_SECRET                 # Generate: openssl rand -base64 32
```

### 4. Configure GitHub Variables
Add these from `terraform output github_variables`:
```
GCP_PROJECT_ID                           # Your GCP project ID
GCP_REGION                              # Deployment region  
CLOUD_RUN_SERVICE_NAME                  # Service name
ARTIFACT_REGISTRY_REPO                  # Docker registry
ALLOWED_BUCKETS                         # Comma-separated bucket list
NEXTAUTH_URL                            # Application URL
NEXT_PUBLIC_FIREBASE_API_KEY            # Firebase config
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        # Firebase config
NEXT_PUBLIC_FIREBASE_PROJECT_ID         # Firebase config
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     # Firebase config
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID # Firebase config
NEXT_PUBLIC_FIREBASE_APP_ID             # Firebase config
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     # Firebase config (optional)
```

## 📋 Complete Workflow

### **First-Time Setup (Recommended):**

1. **🔧 Create Bootstrap Authentication**
   ```bash
   gcloud iam service-accounts create terraform-bootstrap \
     --description="Bootstrap account for initial Terraform run"
   
   gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
     --member="serviceAccount:terraform-bootstrap@YOUR-PROJECT-ID.iam.gserviceaccount.com" \
     --role="roles/editor"
   
   gcloud iam service-accounts keys create bootstrap-key.json \
     --iam-account=terraform-bootstrap@YOUR-PROJECT-ID.iam.gserviceaccount.com
   
   base64 -i bootstrap-key.json | tr -d '\n'
   ```

2. **🔐 Add Bootstrap Secret**
   - GitHub: `Settings > Secrets and variables > Actions > Secrets`
   - Add `GCP_SERVICE_ACCOUNT_KEY` = (base64 output from above)

3. **🏗️ Deploy Infrastructure**
   - GitHub Actions → "Terraform Infrastructure Management"
   - Action: `apply`

4. **🔄 Switch to Workload Identity**
   - Get: `terraform output github_secrets_workload_identity`
   - Add `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` secrets
   - Remove `GCP_SERVICE_ACCOUNT_KEY` secret

5. **🧹 Cleanup Bootstrap**
   ```bash
   gcloud iam service-accounts delete terraform-bootstrap@YOUR-PROJECT-ID.iam.gserviceaccount.com
   ```

### **Alternative: Local Development First**
```bash
gcloud auth login
gcloud auth application-default login
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init && terraform plan && terraform apply
```

## Configuration Setup

### Required Terraform Variables (terraform.tfvars)
```hcl
project_id = "your-gcp-project-id"
region = "us-central1"
github_repo = "your-username/FileManager"  # REPLACE WITH YOUR REPO

storage_buckets = [
  "your-unique-bucket-1",
  "your-unique-bucket-2", 
  "another-unique-bucket"
]

enable_workload_identity = true
```

### Required GitHub Secrets
Go to: `GitHub Repository > Settings > Secrets and variables > Actions > Secrets`

**For Workload Identity (Default):**
```
WIF_PROVIDER                    # From terraform output
WIF_SERVICE_ACCOUNT            # From terraform output
FIREBASE_SERVICE_ACCOUNT_KEY    # Base64 encoded service account JSON
NEXTAUTH_SECRET                 # Generate: openssl rand -base64 32
```

**For Service Account Key:**
```
GCP_SERVICE_ACCOUNT_KEY         # Base64 encoded service account JSON
FIREBASE_SERVICE_ACCOUNT_KEY    # Base64 encoded service account JSON
NEXTAUTH_SECRET                 # Generate: openssl rand -base64 32
```

### Required GitHub Variables
Go to: `GitHub Repository > Settings > Secrets and variables > Actions > Variables`

**From Terraform Outputs:**
```
GCP_PROJECT_ID                  # Your GCP project ID
GCP_REGION                     # Deployment region
CLOUD_RUN_SERVICE_NAME         # Cloud Run service name
ARTIFACT_REGISTRY_REPO         # Artifact registry repository
ALLOWED_BUCKETS                # Comma-separated bucket names
NEXTAUTH_URL                   # Application URL
```

**From Firebase Configuration:**
```
NEXT_PUBLIC_FIREBASE_API_KEY            # Firebase API key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        # project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID         # Firebase project ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     # project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID # Firebase messaging sender ID
NEXT_PUBLIC_FIREBASE_APP_ID             # Firebase app ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     # Google Analytics (optional)
```

## Deployment Steps

### 1. Deploy Infrastructure
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your configuration
terraform init && terraform apply
```

### 2. Get Configuration Values
```bash
terraform output github_variables
terraform output github_secrets_workload_identity
terraform output cloud_run_service_url
```

### 3. Configure GitHub
- Add GitHub Secrets (3-4 secrets)
- Add GitHub Variables (12+ variables)
- Use exact values from terraform outputs

### 4. Deploy Application
```bash
git add . && git commit -m "Configure infrastructure"
git push origin main
```

## Deployment Checklist

- [ ] Install Terraform and authenticate with GCP
- [ ] Configure `terraform/terraform.tfvars` with your settings
- [ ] Run `terraform apply` to create infrastructure
- [ ] Copy configuration values from `terraform output`
- [ ] Add GitHub Secrets (authentication)
- [ ] Add GitHub Variables (configuration)
- [ ] Test deployment workflow
- [ ] Verify application is accessible

## Terraform Commands Reference

```bash
# Navigate to terraform directory
cd terraform

# View all outputs
terraform output

# View specific outputs
terraform output github_variables
terraform output github_secrets_workload_identity

# Update infrastructure
terraform plan && terraform apply

# View current state
terraform show
terraform state list

# Destroy infrastructure (careful!)
terraform destroy
```

## Benefits of This Approach

✅ **Infrastructure as Code**: Version-controlled, repeatable deployments  
✅ **Workload Identity**: More secure than service account keys  
✅ **Automated Configuration**: No manual copying of values  
✅ **Resource Management**: Easy to update and scale infrastructure  
✅ **State Tracking**: Terraform manages all resource states  
✅ **Cost Transparency**: Clear view of all created resources
