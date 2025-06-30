# Terraform Infrastructure for FileManager

This directory contains Terraform configuration to provision all necessary Google Cloud Platform resources for the FileManager application.

## 🚀 Quick Start

**Most users should use the automated GitHub Actions workflow:**

1. **Configure GitHub Variables** (recommended)
   - See [GitHub Variables Setup Guide](../docs/GITHUB_VARIABLES_SETUP.md)
   - Go to: `Repository Settings > Secrets and variables > Actions > Variables`
   - Set `TERRAFORM_PROJECT_ID`, `TERRAFORM_REGION`, `TERRAFORM_STORAGE_BUCKETS`, etc.

2. **Run Infrastructure Workflow**
   - Go to: `GitHub Repository > Actions > Terraform Infrastructure Management`
   - Select `apply` action and run workflow
   - Use GitHub Variables or provide manual inputs

3. **Configure GitHub Secrets**
   - After Terraform completes, set GitHub Secrets with output values
   - See [GitHub Setup Guide](../docs/GITHUB_SETUP.md) for details

**📖 For complete setup instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md)**

## 🏗️ Infrastructure Components

This Terraform configuration creates:

- **Google Cloud APIs** - Enables required services (Cloud Run, Artifact Registry, Storage)
- **Artifact Registry** - Docker repository for container images  
- **Cloud Storage Buckets** - File storage with configurable storage classes (STANDARD, NEARLINE, COLDLINE, ARCHIVE)
- **Service Account** - For GitHub Actions with minimal required permissions
- **Cloud Run Service** - Placeholder service (actual deployment via GitHub Actions)
- **IAM Roles** - Proper permissions for all resources
- **Workload Identity** (Optional) - Secure keyless authentication for GitHub Actions

### Storage Configuration Features

- **Multiple Storage Classes**: Configure buckets with different storage classes for cost optimization
- **Custom Locations**: Override default region/zone for specific buckets  
- **Zone Support**: Uses zone variable when specified for bucket location
- **Lifecycle Management**: Built-in versioning and access controls

## � Validation & Error Handling

The Terraform configuration includes comprehensive validation:

- **Variable Validation** - All input variables are validated for proper format
- **Null Safety** - Optional variables (like `zone`) properly handle null values
- **Early Error Detection** - GitHub Actions workflow catches validation errors before deployment
- **Clear Error Messages** - Helpful guidance when configuration issues occur

If you encounter validation errors, check:
1. All required variables are properly set
2. Variable formats match expected patterns (e.g., valid GCP project IDs)
3. Optional variables are either null or contain valid values

## 📋 Local Development (Optional)

Only use this if you need to manage infrastructure locally:
- **Cloud Run Service** - Placeholder service (actual deployment via GitHub Actions)
- **Workload Identity** (Optional) - Secure keyless authentication
- **IAM Roles** - Proper permissions for all resources

## 📋 Local Development (Advanced Users Only)

**Note: GitHub Actions workflow is recommended for most users.**

### Prerequisites
- Terraform >= 1.6.0
- Google Cloud SDK
- Authenticated with GCP (`gcloud auth login`)

### Commands
```bash
# Initialize
terraform init

# Plan (review changes)
terraform plan

# Apply (create resources)
terraform apply

# View outputs
terraform output

# Destroy (cleanup)
terraform destroy
```

### Configuration
Copy and edit `terraform.tfvars.example`:
```hcl
project_id = "your-gcp-project"
region = "us-central1"
github_repo = "username/repository"
storage_buckets = ["bucket1", "bucket2"]
enable_workload_identity = true
environment = "prod"
```

## 🔒 Security Features

### Workload Identity (Recommended)
- **Keyless authentication** - No service account keys to manage
- **Short-lived tokens** - Automatic token rotation  
- **Repository-specific** - Only your GitHub repository can authenticate
- **Principle of least privilege** - Minimal required permissions

### Service Account Permissions
- `roles/run.admin` - Deploy to Cloud Run
- `roles/artifactregistry.writer` - Push Docker images
- `roles/iam.serviceAccountUser` - Use service accounts
- `roles/cloudbuild.builds.builder` - Build containers
- `roles/storage.admin` - Manage storage buckets

### Storage Security
- **Uniform bucket-level access** enabled
- **Versioning** enabled for file safety
- **CORS** configured for web access  
- **Lifecycle prevention** to avoid accidental deletion

## ⚙️ Customization

### Adding Buckets
Edit `terraform.tfvars`:
```hcl
storage_buckets = [
  "existing-bucket",
  "new-bucket-name"  # Bucket names must be globally unique
]
```

### Environment Configuration
```hcl
environment = "staging"  # dev, staging, or prod
service_name = "filemanager-staging"
region = "europe-west1"  # Any GCP region
```

## 🔧 Troubleshooting

### Common Issues
1. **Permission Denied** - Run `gcloud auth application-default login`
2. **API Not Enabled** - Terraform enables APIs automatically (wait a few minutes)
3. **Bucket Already Exists** - Choose globally unique bucket names
4. **GitHub Repository Not Set** - Set `github_repo` in terraform.tfvars

### Get Help
```bash
# View all outputs
terraform output

# View specific output
terraform output github_variables

# Check state
terraform state list
```

## 💰 Cost Estimate

Typical monthly costs for small usage:
- **Artifact Registry**: ~$0.10/GB storage
- **Cloud Storage**: ~$0.02/GB storage
- **Cloud Run**: Pay-per-use, scales to zero
- **Service Account**: Free

**Estimated total: < $5/month**
