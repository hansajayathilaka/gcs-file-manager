variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run Service Name"
  type        = string
  default     = "filemanager"
}

variable "artifact_registry_repo" {
  description = "Artifact Registry Repository Name"
  type        = string
  default     = "filemanager-repo"
}

variable "storage_buckets" {
  description = "Storage bucket configurations"
  type = list(object({
    name  = string
    class = string
  }))
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "prod"
}

variable "github_repo" {
  description = "GitHub repository (owner/repo)"
  type        = string
}

variable "enable_workload_identity" {
  description = "Enable Workload Identity"
  type        = bool
  default     = true
}
  
  validation {
    condition     = length(var.artifact_registry_repo) > 0
    error_message = "Artifact Registry repository name must be provided. Set TERRAFORM_ARTIFACT_REGISTRY_REPO GitHub Variable or provide manual input."
  }
}

variable "storage_buckets" {
  description = "List of Cloud Storage bucket configurations"
  type = list(object({
    name          = string
    storage_class = optional(string, "STANDARD")
    location      = optional(string, null) # If null, uses region or zone
  }))
  # No default - must be provided via GitHub Variables or manual input
  
  validation {
    condition     = length(var.storage_buckets) > 0
    error_message = "At least one storage bucket must be specified. Set TERRAFORM_STORAGE_BUCKETS GitHub Variable or provide manual input."
  }
  
  validation {
    condition = alltrue([
      for bucket in var.storage_buckets : 
      length(bucket.name) > 0 && contains([
        "STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE", 
        "MULTI_REGIONAL", "REGIONAL"
      ], bucket.storage_class)
    ])
    error_message = "All storage bucket names must be non-empty and storage_class must be one of: STANDARD, NEARLINE, COLDLINE, ARCHIVE, MULTI_REGIONAL, REGIONAL."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  # No default - must be provided via GitHub Variables or manual input
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "github_repo" {
  description = "GitHub repository for workload identity (format: owner/repo)"
  type        = string
  default     = ""
  
  validation {
    condition = var.github_repo == "" || can(regex("^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$", var.github_repo))
    error_message = "GitHub repository must be in format 'owner/repo' or empty string."
  }
}

variable "enable_workload_identity" {
  description = "Enable Workload Identity for GitHub Actions (more secure than service account keys)"
  type        = bool
  # No default - must be provided via GitHub Variables or manual input
  
  validation {
    condition     = var.enable_workload_identity != null
    error_message = "Workload Identity setting must be specified (true or false). Set TERRAFORM_ENABLE_WORKLOAD_IDENTITY GitHub Variable or provide manual input."
  }
}

variable "billing_account_id" {
  description = "The GCP billing account ID (optional - if not provided, billing must be configured manually)"
  type        = string
  default     = ""
  
  validation {
    condition = var.billing_account_id == "" || can(regex("^[0-9A-F]{6}-[0-9A-F]{6}-[0-9A-F]{6}$", var.billing_account_id))
    error_message = "Billing account ID must be in format XXXXXX-XXXXXX-XXXXXX or empty string."
  }
}
