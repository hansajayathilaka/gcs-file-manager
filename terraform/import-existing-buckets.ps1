# PowerShell script to manually import existing storage buckets
# Run this from the terraform directory if you're getting 409 conflicts

Write-Host "🪣 Importing existing storage buckets to avoid 409 conflicts..." -ForegroundColor Yellow

# List of bucket names that already exist (update these with your actual bucket names)
$buckets = @(
    "storied-catwalk-464521-u9-backup",
    "storied-catwalk-464521-u9-storage"
)

foreach ($bucket in $buckets) {
    Write-Host "Importing bucket: $bucket" -ForegroundColor Cyan
    
    # Check if bucket is already in state
    $stateCheck = terraform state show "google_storage_bucket.filemanager_buckets[`"$bucket`"]" 2>$null
    
    if ($stateCheck) {
        Write-Host "✅ Bucket $bucket is already in Terraform state" -ForegroundColor Green
    } else {
        # Try to import the bucket
        $importResult = terraform import "google_storage_bucket.filemanager_buckets[`"$bucket`"]" $bucket 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully imported bucket: $bucket" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to import bucket: $bucket" -ForegroundColor Red
            Write-Host $importResult -ForegroundColor Red
        }
    }
}

Write-Host "`n🎯 Import completed! Now you can run 'terraform plan' and 'terraform apply' without 409 conflicts." -ForegroundColor Green
Write-Host "If you still see conflicts, the buckets might have different configurations than what's in your Terraform files." -ForegroundColor Yellow
