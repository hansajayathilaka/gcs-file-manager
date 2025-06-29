@echo off
REM Cloud Run deployment script for Windows
REM Usage: deploy.bat [PROJECT_ID] [REGION]

set PROJECT_ID=%1
set REGION=%2
set SERVICE_NAME=gcs-file-manager

if "%PROJECT_ID%"=="" set PROJECT_ID=your-gcp-project-id
if "%REGION%"=="" set REGION=us-central1

set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo Building and deploying GCS File Manager to Cloud Run...
echo Project ID: %PROJECT_ID%
echo Region: %REGION%
echo Service Name: %SERVICE_NAME%

REM Build the Docker image
echo Building Docker image...
docker build -t %IMAGE_NAME% .

REM Push the image to Google Container Registry
echo Pushing image to GCR...
docker push %IMAGE_NAME%

REM Deploy to Cloud Run
echo Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
  --image %IMAGE_NAME% ^
  --platform managed ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --set-env-vars "NODE_ENV=production" ^
  --memory=512Mi ^
  --cpu=1 ^
  --timeout=300 ^
  --concurrency=80 ^
  --min-instances=0 ^
  --max-instances=10 ^
  --project=%PROJECT_ID%

echo Deployment complete!
echo Service URL: https://%SERVICE_NAME%-%PROJECT_ID%-%REGION%.a.run.app
