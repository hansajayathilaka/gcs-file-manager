# 🔒 Security Notice

## This Directory is Public-Repository Safe

All Terraform configuration in this directory is designed to work with public repositories:

### ✅ Safe to Commit
- `*.tf` files (contain no sensitive data)
- `terraform.tfvars.example` (example structure only)
- `.gitignore` (prevents sensitive file commits)

### ❌ Never Commit
- `terraform.tfvars` (contains real project data)
- `*.tfstate*` (contains infrastructure state)
- `.terraform/` (local Terraform cache)

### 🔧 How It Works

1. **GitHub Actions workflows** create `terraform.tfvars` dynamically
2. **Real values** come from GitHub Variables/Secrets
3. **Temporary files** are cleaned up after each run
4. **No sensitive data** persists in repository files

### 🚀 Usage

- Run the **"1️⃣ Initial Setup"** workflow to deploy infrastructure
- All configuration is provided via workflow inputs
- Infrastructure state is stored securely in GCS backend
- GitHub Variables/Secrets store all sensitive configuration

This approach allows safe sharing of Infrastructure as Code without exposing sensitive project details.
