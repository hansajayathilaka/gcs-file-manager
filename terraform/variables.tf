# Variables for the FileManager infrastructure

variable "project_id" {
  description = "The GCP project ID"
  type        = string
  # No default - must be provided via GitHub Variables or manual input
  
  validation {
    condition     = length(var.project_id) > 0
    error_message = "Project ID must be provided. Set TERRAFORM_PROJECT_ID GitHub Variable or provide manual input."
  }
}

variable "region" {
  description = "The GCP region for resources"
  type        = string
  # No default - must be provided via GitHub Variables or manual input
  
  validation {
    condition     = length(var.region) > 0
    error_message = "Region must be provided. Set TERRAFORM_REGION GitHub Variable or provide manual input."
  }
}

variable "zone" {
  description = "The GCP zone for resources"
  type        = string
  default     = null
  
  validation {
    condition     = var.zone == null || (var.zone != null && var.zone != "")
    error_message = "Zone must be a valid GCP zone if provided."
  }
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  # No default - must be provided via GitHub Variables or manual input
  
  validation {
    condition     = length(var.service_name) > 0
    error_message = "Service name must be provided. Set TERRAFORM_SERVICE_NAME GitHub Variable or provide manual input."
  }
}

variable "artifact_registry_repo" {
  description = "Name of the Artifact Registry repository"
  type        = string
  # No default - must be provided via GitHub Variables or manual input
  
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
