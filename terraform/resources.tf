# Enable required Google Cloud APIs

resource "google_project_service" "required_apis" {
  for_each = toset([
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "storage.googleapis.com",
    "firebase.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iamcredentials.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  # Don't disable services when destroying
  disable_on_destroy = false
}

# Create Artifact Registry repository
resource "google_artifact_registry_repository" "filemanager_repo" {
  location      = var.region
  repository_id = var.artifact_registry_repo
  description   = "Docker repository for FileManager application"
  format        = "DOCKER"

  # Ignore changes if repository already exists
  lifecycle {
    ignore_changes = [
      # Ignore changes to these fields if resource already exists
      description,
      labels
    ]
  }

  labels = {
    environment = var.environment
    application = "filemanager"
  }

  depends_on = [
    google_project_service.required_apis,
    google_billing_project_info.project_billing
  ]
}

# Create Cloud Storage buckets
resource "google_storage_bucket" "filemanager_buckets" {
  for_each = { for bucket in var.storage_buckets : bucket.name => bucket }
  
  name          = each.value.name
  location      = each.value.location != null ? each.value.location : (var.zone != null ? var.zone : var.region)
  storage_class = each.value.storage_class
  
  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }

  # Enable versioning for file safety
  versioning {
    enabled = true
  }

  # Configure CORS for web access
  cors {
    origin          = ["*"]  # Will be restricted in production
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Uniform bucket-level access
  uniform_bucket_level_access = true

  labels = {
    environment   = var.environment
    application   = "filemanager"
    managed_by    = "terraform"
    storage_class = lower(each.value.storage_class)
  }

  depends_on = [google_project_service.required_apis]
}

# IAM binding for Cloud Storage buckets
resource "google_storage_bucket_iam_member" "bucket_admin" {
  for_each = { for bucket in var.storage_buckets : bucket.name => bucket }
  
  bucket = google_storage_bucket.filemanager_buckets[each.value.name].name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.github_actions.email}"
}

# Service Account for GitHub Actions
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-sa"
  display_name = "GitHub Actions Service Account"
  description  = "Service account for GitHub Actions CI/CD pipeline"
  
  # Ignore changes if service account already exists
  lifecycle {
    ignore_changes = [
      display_name,
      description
    ]
  }
}

# IAM roles for the GitHub Actions service account
resource "google_project_iam_member" "github_actions_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/artifactregistry.writer",
    "roles/iam.serviceAccountUser",
    "roles/cloudbuild.builds.builder",
    "roles/storage.admin"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Workload Identity Pool (for GitHub Actions without service account keys)
resource "google_iam_workload_identity_pool" "github_pool" {
  count = var.enable_workload_identity && var.github_repo != "" ? 1 : 0
  
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
  description               = "Workload Identity Pool for GitHub Actions"
  
  # Ignore changes if pool already exists
  lifecycle {
    ignore_changes = [
      display_name,
      description
    ]
  }
}


# Workload Identity Provider for GitHub
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  count = var.enable_workload_identity && var.github_repo != "" ? 1 : 0
  
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool[0].workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Provider"
  description                        = "Workload Identity Provider for GitHub Actions"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  oidc {
    issuer_uri        = "https://token.actions.githubusercontent.com"
    allowed_audiences = []
  }

  attribute_condition = "assertion.repository == '${var.github_repo}'"
}

# Allow GitHub Actions to impersonate the service account
resource "google_service_account_iam_member" "github_actions_workload_identity" {
  count = var.enable_workload_identity && var.github_repo != "" ? 1 : 0
  
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_pool[0].name}/attribute.repository/${var.github_repo}"
}

# Create a service account key (optional, less secure than Workload Identity)
resource "google_service_account_key" "github_actions_key" {
  count = var.enable_workload_identity ? 0 : 1
  
  service_account_id = google_service_account.github_actions.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# Cloud Run service (placeholder, will be deployed by GitHub Actions)
# This just reserves the name and sets up basic configuration
resource "google_cloud_run_service" "filemanager" {
  name     = var.service_name
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "0"
        "run.googleapis.com/execution-environment" = "gen2"
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }

    spec {
      container_concurrency = 100
      timeout_seconds      = 300
      service_account_name = google_service_account.github_actions.email

      containers {
        # Placeholder image - will be updated by GitHub Actions
        image = "gcr.io/cloudrun/hello"
        
        ports {
          container_port = 8080
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "1Gi"
          }
          requests = {
            cpu    = "500m"
            memory = "512Mi"
          }
        }

        # Basic environment variables (others will be set by GitHub Actions)
        env {
          name  = "NODE_ENV"
          value = "production"
        }
      }
    }
  }

  metadata {
    labels = {
      environment = var.environment
      application = "filemanager"
      managed_by  = "terraform"
    }
  }

  depends_on = [google_project_service.required_apis]
}

# Allow public access to Cloud Run service
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.filemanager.name
  location = google_cloud_run_service.filemanager.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Enable billing for the project (if billing account is provided)
resource "google_billing_project_info" "project_billing" {
  count = var.billing_account_id != "" ? 1 : 0
  
  project         = var.project_id
  billing_account = var.billing_account_id
}
