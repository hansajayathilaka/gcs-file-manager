import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { createManagedBucket, getAllManagedBuckets } from '@/lib/database';
import storage from '@/lib/gcs';
import { AdminBucketCreateRequest, AdminBucketCreateResponse } from '@/types';

// GET - List all managed buckets (admin only)
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const buckets = await getAllManagedBuckets();
    
    return NextResponse.json({
      success: true,
      buckets,
    });
  } catch (error) {
    console.error('Error listing managed buckets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list managed buckets' },
      { status: 500 }
    );
  }
});

// POST - Create new bucket (admin only)
export const POST = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    const bucketData: AdminBucketCreateRequest = await request.json();
    const { name, displayName, location, storageClass, description } = bucketData;
    
    if (!name || !displayName || !location || !storageClass) {
      return NextResponse.json(
        { success: false, error: 'Name, display name, location, and storage class are required' },
        { status: 400 }
      );
    }

    // Validate bucket name format (GCS requirements)
    const bucketNameRegex = /^[a-z0-9]([a-z0-9-._])*[a-z0-9]$/;
    if (!bucketNameRegex.test(name) || name.length < 3 || name.length > 63) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid bucket name. Must be 3-63 characters, lowercase letters, numbers, hyphens, underscores, and periods only.' 
        },
        { status: 400 }
      );
    }

    try {
      // Check if bucket already exists
      const bucket = storage.bucket(name);
      const [exists] = await bucket.exists();
      
      if (exists) {
        return NextResponse.json(
          { success: false, error: 'Bucket already exists' },
          { status: 409 }
        );
      }

      // Create the bucket in GCS
      const [createdBucket] = await storage.createBucket(name, {
        location,
        storageClass,
        uniformBucketLevelAccess: {
          enabled: true,
        },
        // Enable versioning for better file management
        versioning: {
          enabled: true,
        },
        // Set default lifecycle rules
        lifecycle: {
          rule: [
            {
              action: { type: 'Delete' },
              condition: {
                age: 365, // Delete files older than 1 year
                isLive: false, // Only apply to non-current versions
              },
            },
          ],
        },
      });

      console.log(`Bucket ${name} created successfully in GCS`);

      // Create managed bucket record in database
      const managedBucket = await createManagedBucket({
        name,
        displayName,
        location,
        storageClass,
        createdBy: adminUser.uid,
        description,
      });

      const response: AdminBucketCreateResponse = {
        success: true,
        bucket: managedBucket,
      };

      return NextResponse.json(response);
    } catch (gcsError: any) {
      console.error('Error creating GCS bucket:', gcsError);
      
      // Handle specific GCS errors
      if (gcsError.code === 409) {
        return NextResponse.json(
          { success: false, error: 'Bucket name already taken globally' },
          { status: 409 }
        );
      } else if (gcsError.code === 403) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to create bucket' },
          { status: 403 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: `Failed to create bucket: ${gcsError.message}` },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error in bucket creation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create bucket' },
      { status: 500 }
    );
  }
});