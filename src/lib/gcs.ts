import { Storage } from '@google-cloud/storage';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId,
  // When deployed on Cloud Run, authentication will be handled automatically
  // For local development, you'll need to set up Application Default Credentials
});

export const getAllowedBuckets = (): string[] => {
  const buckets = process.env.ALLOWED_BUCKETS;
  return buckets ? buckets.split(',').map(bucket => bucket.trim()) : [];
};

export const isBucketAllowed = (bucketName: string): boolean => {
  const allowedBuckets = getAllowedBuckets();
  return allowedBuckets.includes(bucketName);
};

export default storage;
