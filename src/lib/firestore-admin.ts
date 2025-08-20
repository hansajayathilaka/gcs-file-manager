import { getFirestore as getFirestoreAdmin, Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from './firebase-admin';

let adminDb: Firestore | null = null;

// Lazy initialization for Firestore Admin
export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    adminDb = getFirestoreAdmin(getFirebaseAdminApp());
  }
  return adminDb;
}

// For backward compatibility
export { getAdminFirestore as adminDb };

// Collection names (same as client)
export const COLLECTIONS = {
  USERS: 'users',
  BUCKETS: 'buckets',
  PERMISSIONS: 'permissions',
  AUDIT_LOGS: 'auditLogs',
  SHAREABLE_LINKS: 'shareableLinks',
} as const;

export default getAdminFirestore;