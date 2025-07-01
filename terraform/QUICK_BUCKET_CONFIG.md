# Quick Start: Copy Bucket Configuration from Terraform

This script demonstrates how to quickly get the bucket configuration from your Terraform state that you can copy to GitHub Variables.

## Prerequisites

- Terraform is configured and has been run at least once
- You have valid terraform.tfvars with your bucket configuration

## Get Current Bucket Configuration

```powershell
# Navigate to terraform directory
cd terraform

# Get the current bucket configuration in GitHub Variable format
terraform console -var-file="terraform.tfvars" << 'EOF'
jsonencode(var.storage_buckets)
EOF
```

## Alternative: Use this PowerShell one-liner

```powershell
# Get bucket config from terraform.tfvars and format for GitHub
$buckets = Get-Content terraform.tfvars | Where-Object { $_ -match 'storage_buckets' } | ForEach-Object { ($_ -split '=')[1].Trim() }
Write-Host "Copy this to TERRAFORM_STORAGE_BUCKETS GitHub Variable:"
Write-Host $buckets
```

## Example Output

The output will be ready-to-copy JSON like:
```json
[{"name":"myproject-docs-bucket","storage_class":"STANDARD"},{"name":"myproject-media-bucket","storage_class":"NEARLINE"}]
```

## How to Use

1. **Run one of the commands above** to get your bucket configuration
2. **Copy the JSON output**
3. **Go to GitHub**: Settings > Secrets and variables > Actions > Variables
4. **Create variable**: `TERRAFORM_STORAGE_BUCKETS`
5. **Paste the JSON** as the value
6. **Save** - future workflow runs will use this automatically!

## Why This Helps

- ✅ **No manual JSON formatting** required
- ✅ **No syntax errors** from hand-typing JSON
- ✅ **Consistent across team** - everyone uses the same configuration
- ✅ **One-time setup** - set once, use forever

After setting this GitHub Variable, you won't need to provide bucket configuration as input to the Terraform workflow anymore!
