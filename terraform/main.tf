# Simple Terraform configuration for FileManager

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  # GCS Backend - configured by workflows
  backend "gcs" {}
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}
