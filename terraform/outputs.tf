# Output values that will be useful for GitHub Actions and other integrations

output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "artifact_registry_repository" {
  description = "The Artifact Registry repository name"
  value       = google_artifact_registry_repository.filemanager_repo.name
}

output "artifact_registry_url" {
  description = "The full Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.filemanager_repo.repository_id}"
}

output "storage_buckets" {
  description = "Map of created storage buckets"
  value = {
    for bucket in google_storage_bucket.filemanager_buckets :
    bucket.name => bucket.url
  }
}

output "storage_bucket_names" {
  description = "List of storage bucket names"
  value       = [for bucket in google_storage_bucket.filemanager_buckets : bucket.name]
}

output "service_account_email" {
  description = "Email of the GitHub Actions service account"
  value       = google_service_account.github_actions.email
}

output "service_account_key" {
  description = "Service account key (base64 encoded) - only if workload identity is disabled"
  value       = var.enable_workload_identity ? null : google_service_account_key.github_actions_key[0].private_key
  sensitive   = true
}

output "workload_identity_provider" {
  description = "Workload Identity Provider resource name"
  value       = var.enable_workload_identity && var.github_repo != "" ? google_iam_workload_identity_pool_provider.github_provider[0].name : null
}

output "cloud_run_service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_service.filemanager.status[0].url
}

output "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_service.filemanager.name
}

# GitHub Variables configuration
output "github_variables" {
  description = "GitHub Variables to configure"
  value = {
    GCP_PROJECT_ID              = var.project_id
    GCP_REGION                  = var.region
    CLOUD_RUN_SERVICE_NAME      = google_cloud_run_service.filemanager.name
    ARTIFACT_REGISTRY_REPO      = google_artifact_registry_repository.filemanager_repo.repository_id
    ALLOWED_BUCKETS             = join(",", [for bucket in google_storage_bucket.filemanager_buckets : bucket.name])
    NEXTAUTH_URL                = google_cloud_run_service.filemanager.status[0].url
  }
}

# GitHub Secrets configuration (when using Workload Identity)
output "github_secrets_workload_identity" {
  description = "GitHub Secrets to configure when using Workload Identity"
  value = var.enable_workload_identity && var.github_repo != "" ? {
    WIF_PROVIDER      = google_iam_workload_identity_pool_provider.github_provider[0].name
    WIF_SERVICE_ACCOUNT = google_service_account.github_actions.email
  } : {}
}

# Instructions for manual setup
output "setup_instructions" {
  description = "Instructions for completing the setup"
  value = var.enable_workload_identity ? {
    message = "Workload Identity is enabled. Configure GitHub with the WIF_PROVIDER and WIF_SERVICE_ACCOUNT secrets."
    github_variables = "Use the 'github_variables' output to configure GitHub Variables"
    github_secrets = "Use the 'github_secrets_workload_identity' output to configure GitHub Secrets"
  } : {
    message = "Service Account Key method is used. Add the service_account_key to GitHub Secrets as GCP_SERVICE_ACCOUNT_KEY"
    github_variables = "Use the 'github_variables' output to configure GitHub Variables"
    github_secrets = "Add the 'service_account_key' output to GitHub Secrets as GCP_SERVICE_ACCOUNT_KEY"
  }
}
