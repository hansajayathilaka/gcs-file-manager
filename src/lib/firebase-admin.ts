import { initializeApp, getApps, applicationDefault, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getRuntimeConfig } from './runtime-config';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

// Lazy initialization function for Firebase Admin
function initializeFirebaseAdmin(): App {
  if (adminApp) return adminApp;
  
  const config = getRuntimeConfig();
  const projectId = config.firebase.projectId || config.server.googleCloudProjectId;
  
  // Only initialize if we have a project ID
  if (!projectId) {
    throw new Error('Firebase Admin configuration is missing project ID');
  }
  
  const firebaseAdminConfig = {
    credential: applicationDefault(),
    projectId,
  };
  
  adminApp = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
  return adminApp;
}

// Lazy getter for Firebase Admin App
export function getFirebaseAdminApp(): App {
  return initializeFirebaseAdmin();
}

// Lazy getter for Firebase Admin Auth
export function getFirebaseAdminAuth(): Auth {
  if (!adminAuth) {
    const app = getFirebaseAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

// For backward compatibility
export { getFirebaseAdminAuth as adminAuth };
export default getFirebaseAdminApp;
