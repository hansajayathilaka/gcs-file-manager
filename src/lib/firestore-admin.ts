import { getFirestore } from 'firebase-admin/firestore';
import adminApp from './firebase-admin';

// Initialize Firestore Admin
export const adminDb = getFirestore(adminApp);

// Collection names (same as client)
export const COLLECTIONS = {
  USERS: 'users',
  BUCKETS: 'buckets',
  PERMISSIONS: 'permissions',
  AUDIT_LOGS: 'auditLogs',
  SHAREABLE_LINKS: 'shareableLinks',
} as const;

export default adminDb;