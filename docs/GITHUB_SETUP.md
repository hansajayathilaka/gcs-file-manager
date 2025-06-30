# GitHub Secrets and Variables for FileManager Deployment

## Quick Reference for GitHub Configuration

### Method 1: Workload Identity (Recommended - More Secure)

#### GitHub Secrets (Sensitive Data)
Go to: `GitHub Repository > Settings > Secrets and variables > Actions > Secrets`

```
WIF_PROVIDER                    # From terraform output
WIF_SERVICE_ACCOUNT            # From terraform output  
FIREBASE_SERVICE_ACCOUNT_KEY    # Base64 encoded from .env.local 
NEXTAUTH_SECRET                 # Generate with: openssl rand -base64 32
```

### Method 2: Service Account Key (Less Secure)

#### GitHub Secrets (Sensitive Data)
Go to: `GitHub Repository > Settings > Secrets and variables > Actions > Secrets`

```
GCP_SERVICE_ACCOUNT_KEY         # From terraform output (if workload identity disabled)
FIREBASE_SERVICE_ACCOUNT_KEY    # Base64 encoded from .env.local 
NEXTAUTH_SECRET                 # Generate with: openssl rand -base64 32
```

### GitHub Variables (Non-sensitive Configuration)
Go to: `GitHub Repository > Settings > Secrets and variables > Actions > Variables`

**Use values from `terraform output github_variables`:**

```
GCP_PROJECT_ID                           # From terraform output
GCP_REGION                              # From terraform output  
CLOUD_RUN_SERVICE_NAME                  # From terraform output
ARTIFACT_REGISTRY_REPO                  # From terraform output
ALLOWED_BUCKETS                         # From terraform output
NEXTAUTH_URL                            # From terraform output
NEXT_PUBLIC_FIREBASE_API_KEY            # From your Firebase project config
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        # your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID         # your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     # your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID # Your messaging sender ID
NEXT_PUBLIC_FIREBASE_APP_ID             # Your Firebase app ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     # Your Google Analytics measurement ID
```

## Setup Steps Summary

### 1. Deploy Infrastructure with Terraform

```bash
# Navigate to terraform directory
cd terraform

# Copy and configure terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
# IMPORTANT: Edit terraform.tfvars and set github_repo = "your-username/FileManager"

# Initialize and deploy
terraform init
terraform plan
terraform apply
```

### 2. Get Configuration Values

```bash
# Get all GitHub configuration
terraform output github_variables
terraform output github_secrets_workload_identity

# Get specific values
terraform output cloud_run_service_url
terraform output service_account_email
```

### 3. Configure GitHub

#### For Workload Identity (Default):
1. **Add GitHub Secrets**:
   - `WIF_PROVIDER`: From terraform output
   - `WIF_SERVICE_ACCOUNT`: From terraform output
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: From .env.local
   - `NEXTAUTH_SECRET`: Generate new

2. **Add GitHub Variables**:
   - Use all values from `terraform output github_variables`
   - Add Firebase variables from .env.local

#### For Service Account Key:
1. Set `enable_workload_identity = false` in terraform.tfvars
2. Run `terraform apply`
3. **Add GitHub Secrets**:
   - `GCP_SERVICE_ACCOUNT_KEY`: From `terraform output service_account_key`
   - `FIREBASE_SERVICE_ACCOUNT_KEY`: From .env.local
   - `NEXTAUTH_SECRET`: Generate new

### 4. Deploy Application

```bash
# Push to main branch to trigger deployment
git add .
git commit -m "Add Terraform infrastructure and GitHub Actions"
git push origin main
```

## Configuration from Your Current .env.local

**Terraform Variables (terraform.tfvars):**
```hcl
project_id = "your-gcp-project-id"
region = "us-central1"
github_repo = "your-username/FileManager"  # REPLACE WITH YOUR REPO

storage_buckets = [
  "your-unique-bucket-1",
  "your-unique-bucket-2", 
  "another-unique-bucket",
  "your-project-storage"
]

enable_workload_identity = true
```

**GitHub Variables (from .env.local):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**GitHub Secrets:**
```
FIREBASE_SERVICE_ACCOUNT_KEY=base64-encoded-service-account-json
NEXTAUTH_SECRET=[generate new with: openssl rand -base64 32]
```

## Deployment Checklist

- [ ] Install Terraform and authenticate with GCP
- [ ] Configure `terraform/terraform.tfvars` with your GitHub repo
- [ ] Run `terraform apply` to create infrastructure
- [ ] Get configuration values with `terraform output`
- [ ] Add GitHub Secrets (2-4 secrets depending on method)
- [ ] Add GitHub Variables (12+ variables)
- [ ] Push to main branch to trigger deployment
- [ ] Check GitHub Actions for success
- [ ] Test the application

## Terraform Commands Reference

```bash
# Navigate to terraform directory
cd terraform

# View outputs
terraform output
terraform output github_variables
terraform output github_secrets_workload_identity

# Update infrastructure
terraform apply

# View current state
terraform show
terraform state list

# Destroy infrastructure (careful!)
terraform destroy
```

## After Deployment

1. The Cloud Run URL will be automatically set in terraform outputs
2. Test the application by visiting the URL
3. Check GitHub Actions logs for any issues
4. Monitor the application in GCP Console

## Advantages of Terraform Approach

✅ **Infrastructure as Code**: Version-controlled, repeatable deployments  
✅ **Workload Identity**: More secure than service account keys  
✅ **Automated Outputs**: No manual copying of configuration values  
✅ **Resource Management**: Easy to update, scale, or destroy infrastructure  
✅ **State Management**: Terraform tracks all resource states  
✅ **Cost Transparency**: Clear view of all created resources
