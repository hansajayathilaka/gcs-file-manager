# FileManager - Secure GCS File Management

A Next.js application for managing Google Cloud Storage buckets with Firebase authentication. Deployed on Google Cloud Run with Infrastructure as Code (Terraform).

## 🔒 Security First

This is a **public repository** designed to be safely shared:
- ✅ **No sensitive data in repository files**
- ✅ **All configuration stored in GitHub Variables/Secrets**
- ✅ **Terraform state managed remotely in GCS**
- ✅ **Workload Identity for keyless authentication**

## 🚀 Quick Start (4 Simple Workflows)

### 1️⃣ Initial Setup
**Workflow: `setup.yml`**
- Go to **Actions** tab → **"1️⃣ Initial Setup"** → **"Run workflow"**
- Provide: Project ID, Region, Initial bucket names, Storage classes
- Creates infrastructure, state bucket, and provides configuration guide

### 🪣 Add Storage Buckets
**Workflow: `add-buckets.yml`**
- Go to **Actions** tab → **"🪣 Add Storage Buckets"** → **"Run workflow"**
- Provide: New bucket names and storage classes
- Adds buckets to existing infrastructure
- **Secure**: Bucket names never stored in repository files

### 🔧 Update Infrastructure
**Workflow: `update-infrastructure.yml`**
- Go to **Actions** tab → **"🔧 Update Infrastructure"** → **"Run workflow"**
- Plan/Apply infrastructure changes (service accounts, IAM, etc.)
- Override variables as needed
- Document changes for audit trail

### 🚀 Deploy Application
**Workflow: `deploy.yml`**
- Go to **Actions** tab → **"🚀 Deploy Application"** → **"Run workflow"**
- **Options**: Use YAML template or gcloud CLI deployment
- **Triggers**: Manual run or automatic on push to main branch
- **Features**: Builds Next.js app, deploys to Cloud Run, provides live URL
- **Template Support**: Uses your custom Cloud Run YAML template for advanced configuration

## 🏗️ Architecture

### Infrastructure (Terraform)
- **Cloud Run**: Scalable containerized application hosting
- **Cloud Storage**: Multiple buckets with different storage classes
- **Artifact Registry**: Docker image storage
- **Workload Identity**: Keyless GitHub Actions authentication
- **IAM**: Least-privilege service account

### Application (Next.js)
- **Three-panel layout**: Sidebar, file browser, preview panel
- **Firebase Auth**: Email/password + Google OAuth
- **File Operations**: Upload, download, delete, preview
- **Streaming Support**: Large file handling with HTTP range requests
- **Multi-format Preview**: Images, videos, audio, text, documents

## 🔧 Required Configuration

All configuration is stored securely in GitHub:

### GitHub Variables (Public)
```
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
CLOUD_RUN_SERVICE_NAME=filemanager
ARTIFACT_REGISTRY_REPO=filemanager-repo
ALLOWED_BUCKETS=bucket1,bucket2,bucket3
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### GitHub Secrets (Private)
```
GCP_SERVICE_ACCOUNT_KEY=your-gcp-service-account-json
WIF_PROVIDER=your-workload-identity-provider (if using Workload Identity)
WIF_SERVICE_ACCOUNT=your-service-account-email (if using Workload Identity)
FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-service-account-json
NEXTAUTH_SECRET=random-32-byte-string
```

## 📦 Local Development

```bash
# Install dependencies
npm install

# Create environment file (never commit this!)
cp .env.local.example .env.local
# Edit .env.local with your Firebase config

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## 🌐 Production Deployment

Deployment is fully automated via GitHub Actions:

1. **Push to main** → Automatic deployment
2. **Manual deployment** → Run "3️⃣ Deploy Application" workflow

The deployed application includes:
- Automatic SSL certificates
- Auto-scaling based on traffic
- Health checks and monitoring
- Environment variable injection

## 🛠️ Management

### Adding New Buckets
1. Run **"🪣 Add Storage Buckets"** workflow
2. Provide new bucket names and storage classes
3. Update GitHub Variable `ALLOWED_BUCKETS` as instructed
4. **Security**: Bucket names stored only in GitHub Variables, never in repository

### Deploying the Application
1. Run **"� Deploy Application"** workflow
2. **Choose deployment method**:
   - **YAML Template** (recommended): Uses your custom Cloud Run template
   - **gcloud CLI**: Simple command-line deployment
3. **Automatic deployment**: Push to main branch auto-deploys
4. **Live URL**: Get application URL in workflow output

### Updating Infrastructure
1. Run **"🔧 Update Infrastructure"** workflow
2. Choose **plan** to preview changes or **apply** to implement
3. Document what changes you're making
4. Override variables if needed

### Monitoring
- **Cloud Run Console**: Monitor application performance
- **Cloud Storage Console**: Manage bucket contents  
- **GitHub Actions**: View deployment and infrastructure history

## 🔒 Security Features

- **Workload Identity**: Keyless authentication between GitHub Actions and GCP
- **Least Privilege IAM**: Service accounts with minimal required permissions
- **No Hardcoded Secrets**: All sensitive data in GitHub Secrets
- **Public Repo Safe**: No sensitive information in repository files
- **Firebase Auth**: Secure user authentication and authorization
- **Environment Isolation**: Separate environments with isolated resources

## 📁 Project Structure

```
├── .github/workflows/       # GitHub Actions workflows
│   ├── setup.yml           # 1️⃣ Initial infrastructure setup
│   ├── add-buckets.yml     # 🪣 Add new storage buckets
│   ├── update-infrastructure.yml # 🔧 Update infrastructure (IAM, services)
│   └── deploy.yml          # 3️⃣ Application deployment
├── src/                    # Next.js application
│   ├── app/               # App Router pages and API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities and configurations
│   └── types/             # TypeScript definitions
├── terraform/             # Infrastructure as Code
│   ├── main.tf            # Provider configuration
│   ├── variables.tf       # Variable definitions
│   ├── resources.tf       # Resource definitions
│   ├── outputs.tf         # Output values (sensitive data marked)
│   ├── SECURITY.md        # Security documentation
│   └── terraform.tfvars.example # Example structure (no real data)
└── docs/                  # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

The automated workflows will handle infrastructure and deployment.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**🔒 Repository Security Notice**: This repository is designed to be public-safe. All sensitive configuration is stored in GitHub Variables/Secrets, never in repository files.
