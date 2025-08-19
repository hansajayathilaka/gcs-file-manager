import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { createManagedBucket, getAllManagedBuckets } from '@/lib/database';
import storage from '@/lib/gcs';

// GET - Discover existing buckets that can be imported (admin only)
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    // Get all buckets from GCS
    const [gcsBuckets] = await storage.getBuckets();
    
    // Get already managed buckets from database
    const managedBuckets = await getAllManagedBuckets();
    const managedBucketNames = new Set(managedBuckets.map(b => b.name));
    
    // Filter out already managed buckets
    const availableForImport = gcsBuckets
      .filter(bucket => !managedBucketNames.has(bucket.name))
      .map(bucket => ({
        name: bucket.name,
        location: bucket.metadata.location,
        storageClass: bucket.metadata.storageClass,
        created: bucket.metadata.timeCreated,
        updated: bucket.metadata.updated,
        metageneration: bucket.metadata.metageneration,
      }));

    return NextResponse.json({
      success: true,
      availableBuckets: availableForImport,
      totalGcsBuckets: gcsBuckets.length,
      alreadyManaged: managedBuckets.length,
    });
  } catch (error) {
    console.error('Error discovering buckets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to discover buckets' },
      { status: 500 }
    );
  }
});

// POST - Import existing bucket(s) (admin only)
export const POST = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    const { buckets } = await request.json();
    
    if (!buckets || !Array.isArray(buckets)) {
      return NextResponse.json(
        { success: false, error: 'Buckets array is required' },
        { status: 400 }
      );
    }

    const importResults = [];
    const managedBuckets = await getAllManagedBuckets();
    const managedBucketNames = new Set(managedBuckets.map(b => b.name));

    for (const bucketToImport of buckets) {
      const { name, displayName, description } = bucketToImport;
      
      if (!name) {
        importResults.push({
          name: name || 'unknown',
          success: false,
          error: 'Bucket name is required',
        });
        continue;
      }

      // Check if already managed
      if (managedBucketNames.has(name)) {
        importResults.push({
          name,
          success: false,
          error: 'Bucket is already managed',
        });
        continue;
      }

      try {
        // Verify bucket exists in GCS and get its metadata
        const bucket = storage.bucket(name);
        const [exists] = await bucket.exists();
        
        if (!exists) {
          importResults.push({
            name,
            success: false,
            error: 'Bucket does not exist in GCS',
          });
          continue;
        }

        const [metadata] = await bucket.getMetadata();
        
        // Create managed bucket record in database
        const managedBucket = await createManagedBucket({
          name,
          displayName: displayName || name,
          location: metadata.location || 'unknown',
          storageClass: metadata.storageClass || 'STANDARD',
          createdBy: adminUser.uid,
          description: description || `Imported bucket from GCS`,
          imported: true,
          importedAt: new Date(),
        });

        importResults.push({
          name,
          success: true,
          bucket: managedBucket,
        });

        console.log(`Successfully imported bucket: ${name}`);
      } catch (error: any) {
        console.error(`Error importing bucket ${name}:`, error);
        importResults.push({
          name,
          success: false,
          error: error.message || 'Failed to import bucket',
        });
      }
    }

    const successfulImports = importResults.filter(r => r.success);
    const failedImports = importResults.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Imported ${successfulImports.length} of ${buckets.length} buckets`,
      results: importResults,
      summary: {
        total: buckets.length,
        successful: successfulImports.length,
        failed: failedImports.length,
      },
    });
  } catch (error) {
    console.error('Error in bucket import:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import buckets' },
      { status: 500 }
    );
  }
});