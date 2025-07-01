# GitHub Variables Setup for Terraform Infrastructure Management

This document explains how to configure GitHub Variables to provide default values for the Terraform Infrastructure Management workflow.

## ⚠️ Important: All Variables Are Required

**No hard-coded defaults are provided for security reasons.** You must either:
1. Set GitHub Variables (recommended for teams)
2. Provide manual input when running the workflow

The workflow will fail with clear error messages if required variables are missing.

## Overview

The Terraform workflow requires explicit configuration for all infrastructure components. This prevents accidental deployments to wrong projects or environments.

## Setting Up GitHub Variables

Go to your GitHub repository: `Settings > Secrets and variables > Actions > Variables`

### Required GitHub Variables for Terraform Defaults

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `TERRAFORM_PROJECT_ID` | GCP Project ID | `my-project-123` | ✅ Yes |
| `TERRAFORM_REGION` | GCP Region | `us-central1` | ✅ Yes |
| `TERRAFORM_SERVICE_NAME` | Cloud Run Service Name | `filemanager` | ✅ Yes |
| `TERRAFORM_ARTIFACT_REGISTRY_REPO` | Artifact Registry Repository | `filemanager-repo` | ✅ Yes |
| `TERRAFORM_STORAGE_BUCKETS` | Storage Buckets (JSON format) | `[{"name":"bucket1","storage_class":"STANDARD"}]` | ✅ Yes |
| `TERRAFORM_ENVIRONMENT` | Environment | `prod` | ✅ Yes |
| `TERRAFORM_ENABLE_WORKLOAD_IDENTITY` | Enable Workload Identity | `true` | ✅ Yes |
| `TERRAFORM_GITHUB_REPO` | GitHub Repository | `username/repository` | ⚠️ Optional* |
| `TERRAFORM_BILLING_ACCOUNT_ID` | Billing Account ID | `123456-789ABC-DEF012` | ❌ Optional*** |

*GitHub repository is auto-detected if not provided.
**Billing account ID is optional and only required if your GCP project doesn't have billing enabled.
***Billing account ID is optional - you can enable billing manually in Google Cloud Console instead.

### Fallback Variables

The workflow also supports fallback to existing deployment variables:

| Fallback Variable | Used For |
|-------------------|----------|
| `GCP_PROJECT_ID` | Project ID fallback |
| `GCP_REGION` | Region fallback |
| `CLOUD_RUN_SERVICE_NAME` | Service name fallback |
| `ARTIFACT_REGISTRY_REPO` | Artifact Registry fallback |
| `ALLOWED_BUCKETS` | Storage buckets fallback |

## Variable Priority Order

The workflow uses the following priority order to determine values:

1. **Manual Input** - Values entered when running the workflow manually
2. **Primary GitHub Variable** - `TERRAFORM_*` variables
3. **Fallback GitHub Variable** - Existing deployment variables
4. **No Default** - **Workflow fails with clear error message**

## Example Configuration

Here's an example of setting up GitHub Variables for a project:

**⚠️ Important: Replace all example values with your actual values**

```bash
# Project Configuration (REQUIRED)
TERRAFORM_PROJECT_ID=my-filemanager-project  # Use your actual GCP project ID
TERRAFORM_REGION=us-west2                     # Choose your preferred region
TERRAFORM_ENVIRONMENT=prod                    # Choose: dev, staging, or prod

# Service Configuration (REQUIRED)
TERRAFORM_SERVICE_NAME=filemanager-app
TERRAFORM_ARTIFACT_REGISTRY_REPO=filemanager-images

# Storage Configuration (REQUIRED)
# NOTE: Bucket names must be globally unique across all of GCP
# JSON format with storage classes:
TERRAFORM_STORAGE_BUCKETS='[{"name":"my-unique-docs-bucket","storage_class":"STANDARD"},{"name":"my-unique-media-bucket","storage_class":"NEARLINE"},{"name":"my-unique-backup-bucket","storage_class":"COLDLINE"}]'

# Security Configuration (REQUIRED)
TERRAFORM_ENABLE_WORKLOAD_IDENTITY=true
TERRAFORM_GITHUB_REPO=myorg/filemanager       # Your actual GitHub repository

# Billing Configuration (OPTIONAL - Manual setup recommended)
# Only set this if you want Terraform to manage billing for you
# Otherwise, enable billing manually in Google Cloud Console (recommended)
# Format: XXXXXX-XXXXXX-XXXXXX (found in Google Cloud Console > Billing)
# TERRAFORM_BILLING_ACCOUNT_ID=123456-789ABC-DEF012  # Optional: only if using Terraform billing management
```

## Benefits of Using GitHub Variables

1. **Security** - No hard-coded defaults prevent accidental deployments
2. **Consistency** - Same configuration used across all workflow runs
3. **Team Collaboration** - Shared defaults for all team members
4. **Environment Management** - Different repositories can have different defaults
5. **Flexibility** - Can still override values when needed
6. **Error Prevention** - Clear validation ensures all required values are provided

## Setting Variables via GitHub CLI

You can also set variables programmatically using the GitHub CLI:

**⚠️ Important: Replace all example values with your actual values**

```bash
# Install GitHub CLI: https://cli.github.com/

# Set Terraform defaults (REPLACE WITH YOUR ACTUAL VALUES)
gh variable set TERRAFORM_PROJECT_ID --body "YOUR-ACTUAL-PROJECT-ID"
gh variable set TERRAFORM_REGION --body "us-central1"  # or your preferred region
gh variable set TERRAFORM_SERVICE_NAME --body "filemanager"
gh variable set TERRAFORM_ARTIFACT_REGISTRY_REPO --body "filemanager-repo"
# JSON format (required)
gh variable set TERRAFORM_STORAGE_BUCKETS --body '[{"name":"your-unique-bucket1","storage_class":"STANDARD"},{"name":"your-unique-bucket2","storage_class":"NEARLINE"}]'
gh variable set TERRAFORM_ENVIRONMENT --body "prod"  # or dev/staging
gh variable set TERRAFORM_ENABLE_WORKLOAD_IDENTITY --body "true"
gh variable set TERRAFORM_GITHUB_REPO --body "yourusername/yourrepo"
# Optional: Only set if you want Terraform to manage billing (manual setup recommended)
# gh variable set TERRAFORM_BILLING_ACCOUNT_ID --body "123456-789ABC-DEF012"
```

## Validation and Error Messages

The workflow includes comprehensive validation:

- **Missing Variables**: Clear error messages showing exactly which variables need to be set
- **Invalid Values**: Validation for environment names, boolean values, etc.
- **Empty Buckets**: Ensures at least one storage bucket is specified
- **Format Validation**: Checks GitHub repository format (owner/repo)

### Example Error Message

If you forget to set required variables, you'll see:

```
❌ ERROR: Missing required configuration variables:
- project_id (set TERRAFORM_PROJECT_ID variable or provide manual input)
- region (set TERRAFORM_REGION variable or provide manual input)
- storage_buckets (set TERRAFORM_STORAGE_BUCKETS variable or provide manual input)

Please either:
1. Set GitHub Variables at: Settings > Secrets and variables > Actions > Variables
2. Provide values when running this workflow manually

See docs/GITHUB_VARIABLES_SETUP.md for detailed setup instructions
```

## 🗄️ Storage Classes Guide

When configuring `TERRAFORM_STORAGE_BUCKETS`, choose the appropriate storage class for your use case:

### Storage Class Options

| Storage Class | Access Frequency | Best For | Cost |
|---------------|------------------|----------|------|
| `STANDARD` | Frequently accessed | Active data, website content, streaming | Higher storage, lower access |
| `NEARLINE` | Less than once/month | Backups, long-tail content | Lower storage, higher access |
| `COLDLINE` | Less than once/quarter | Disaster recovery, archival | Much lower storage, high access |
| `ARCHIVE` | Less than once/year | Long-term preservation | Lowest storage, highest access |

## 🔄 Copying Configuration from Workflow Output

**Easiest Way to Set TERRAFORM_STORAGE_BUCKETS**: After running the Terraform workflow (plan or apply), the bucket configuration is displayed in the workflow summary for easy copying.

### Step-by-Step Process

1. **Run the Terraform workflow** (even with `plan` action)
2. **Check the workflow summary** at the bottom of the workflow run page
3. **Look for the "📦 Storage Buckets Configuration" section**
4. **Copy the JSON** from the code block
5. **Set as GitHub Variable**:
   - Go to: `Settings > Secrets and variables > Actions > Variables`
   - Create/update variable: `TERRAFORM_STORAGE_BUCKETS`
   - Paste the JSON as the value
   - Click "Add variable"

### What This Achieves

- **No manual JSON formatting** - the workflow outputs perfectly formatted JSON
- **No typos or syntax errors** - the configuration is generated automatically
- **Persistent for future runs** - once set as a GitHub Variable, future workflows use it automatically
- **Team consistency** - everyone uses the same bucket configuration

### Example Workflow Output

The workflow summary will show something like this:

```markdown
### 📦 Storage Buckets Configuration

**Current bucket configuration (copy this for TERRAFORM_STORAGE_BUCKETS GitHub Variable):**
```json
[{"name":"myproject-docs-bucket","storage_class":"STANDARD"},{"name":"myproject-media-bucket","storage_class":"NEARLINE"}]
```

**To reuse this configuration:**
1. Go to: Settings > Secrets and variables > Actions > Variables
2. Create/update variable: `TERRAFORM_STORAGE_BUCKETS`
3. Paste the JSON above as the value
4. Future workflow runs will automatically use this configuration
```

This eliminates the need to manually format JSON or remember bucket configurations for future deployments.

### Configuration Examples

**For GitHub Variables (strict JSON required)**:
```json
[
  {"name":"myapp-active-data","storage_class":"STANDARD"},
  {"name":"myapp-monthly-backups","storage_class":"NEARLINE"},
  {"name":"myapp-archive","storage_class":"COLDLINE"}
]
```

**For GitHub Actions Workflow Input (flexible format)**:
```json
[{"name":"bucket1","storage_class":"STANDARD"}]
```
or
```json
[{name:bucket1,storage_class:STANDARD}]
```

**Custom Location** (optional):
```json
[
  {"name":"myapp-eu-bucket","storage_class":"STANDARD","location":"europe-west1"}
]
```

**Note**: If no `location` is specified, buckets will use the zone (if configured) or region from your Terraform configuration.

### GitHub Actions Input Format

When manually running the Terraform workflow and providing bucket configuration as input, GitHub Actions has some JSON parsing quirks. Both formats work:

**Standard JSON** (recommended for GitHub Variables):
```json
[{"name":"bucket1","storage_class":"STANDARD"}]
```

**Simplified format** (works in GitHub Actions workflow input):
```json
[{name:bucket1,storage_class:STANDARD}]
```

The workflow automatically fixes the quotes for GitHub Actions inputs.

## Configuration Summary

When you run the Terraform workflow, it will display a configuration summary showing:
- Which values are being used
- Where each value came from (Manual Input, GitHub Variable, or Default)
- The final configuration that will be applied

This helps you verify that the correct settings are being used before applying changes to your infrastructure.

## Next Steps

1. **Set up variables** using the GitHub web interface or CLI
2. **Run the Terraform workflow** with action `plan` to test the configuration
3. **Review the configuration summary** in the workflow output
4. **Apply infrastructure** with action `apply` when ready

The workflow will automatically use your GitHub Variables as defaults, but you can always override them when running the workflow manually if needed.

## 🏦 Billing Account Setup

Google Cloud requires billing to be enabled to use most services (like Artifact Registry, Cloud Run, etc.). You have two options:

### Option 1: Manual Billing Setup (Recommended)

If you prefer to keep billing configuration separate from Terraform, set up billing manually:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/billing
2. **Select your project** from the project dropdown
3. **Check billing status**:
   - If billing is already enabled, you'll see your billing account
   - If not enabled, you'll see "This project has no billing account"
4. **Enable billing** (if needed):
   - Click "Link a billing account"
   - **If you have an existing billing account**: Select it from the dropdown
   - **If you need a new billing account**: 
     - Click "Create billing account"
     - Enter account name (e.g., "My Personal Account")
     - Add payment method (credit card)
     - Complete the setup
5. **Link billing account to your project**:
   - Select your billing account
   - Click "Set account"

**✅ Recommended**: Use this approach and leave `TERRAFORM_BILLING_ACCOUNT_ID` unset.

### Option 2: Terraform Billing Management

If you want Terraform to manage billing (requires billing account ID):

1. **Find your billing account ID**:
   - Go to Google Cloud Console > Billing
   - Copy the billing account ID (format: `XXXXXX-XXXXXX-XXXXXX`)
2. **Set the GitHub Variable**:
   ```bash
   TERRAFORM_BILLING_ACCOUNT_ID=123456-789ABC-DEF012
   ```
   Or provide it as manual input when running the workflow.

### Billing Error Troubleshooting

If you see errors like:
```
Error 400: Billing account for project is not found. 
Billing must be enabled for activation of service(s) to proceed.
```

**Solution**: Follow Option 1 above to enable billing manually, then re-run your Terraform workflow.

### Free Tier Considerations

- **Google Cloud Free Tier**: Includes limited usage of many services
- **Always Free products**: Some services have generous always-free quotas
- **Billing required**: Even with free tier, a billing account must be linked
- **No unexpected charges**: Free tier usage won't generate charges, but billing account is still required for service activation
