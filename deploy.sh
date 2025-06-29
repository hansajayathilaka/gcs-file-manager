#!/bin/bash

# Cloud Run deployment script for GCS File Manager
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

PROJECT_ID=${1:-"your-gcp-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="gcs-file-manager"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Building and deploying GCS File Manager to Cloud Run..."
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"

# Build the Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME .

# Push the image to Google Container Registry
echo "Pushing image to GCR..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=10 \
  --project=$PROJECT_ID

echo "Deployment complete!"
echo "Service URL: https://$SERVICE_NAME-$(gcloud config get-value project)-$REGION.a.run.app"
