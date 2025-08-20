import { getFirestore as getFirestoreService, Firestore } from 'firebase/firestore';
import { getFirebaseApp } from './firebase';

let db: Firestore | null = null;

// Lazy initialization for Firestore
export function getFirestore(): Firestore {
  if (!db) {
    db = getFirestoreService(getFirebaseApp());
  }
  return db;
}

// For backward compatibility
export { getFirestore as db };

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  BUCKETS: 'buckets',
  PERMISSIONS: 'permissions',
  AUDIT_LOGS: 'auditLogs',
  SHAREABLE_LINKS: 'shareableLinks',
} as const;

export default getFirestore;