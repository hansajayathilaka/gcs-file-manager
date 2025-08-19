import { getFirestore } from 'firebase/firestore';
import app from './firebase';

// Initialize Firestore
export const db = getFirestore(app);

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  BUCKETS: 'buckets',
  PERMISSIONS: 'permissions',
  AUDIT_LOGS: 'auditLogs',
  SHAREABLE_LINKS: 'shareableLinks',
} as const;

export default db;