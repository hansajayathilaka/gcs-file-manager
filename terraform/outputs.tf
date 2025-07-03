output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
  sensitive   = true  # Prevent exposure in logs
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "service_account_email" {
  description = "Service Account Email for Cloud Run"
  value       = google_service_account.cloud_run.email
}

output "artifact_registry_repo" {
  description = "Artifact Registry Repository Name"
  value       = google_artifact_registry_repository.filemanager.name
}

output "workload_identity_provider" {
  description = "Workload Identity Provider for GitHub Actions"
  value       = var.enable_workload_identity ? google_iam_workload_identity_pool_provider.github[0].name : null
  sensitive   = true  # Sensitive for security
}

output "workload_identity_service_account" {
  description = "Workload Identity Service Account Email"
  value       = google_service_account.cloud_run.email
}

# Note: Bucket names are intentionally NOT output to prevent exposure in logs
# Bucket configuration is managed securely via GitHub Variables
