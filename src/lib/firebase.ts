import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getPublicRuntimeConfig } from './runtime-config';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Lazy initialization function
function initializeFirebase(): FirebaseApp {
  if (app) return app;
  
  const config = getPublicRuntimeConfig();
  const firebaseConfig = config.firebase;
  
  // Only initialize if we have valid config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase configuration is missing required fields');
  }
  
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return app;
}

// Lazy getters for Firebase services
export function getFirebaseApp(): FirebaseApp {
  return initializeFirebase();
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const app = getFirebaseApp();
    auth = getAuth(app);
  }
  return auth;
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
  }
  return googleProvider;
}

// For backward compatibility
export { getFirebaseAuth as auth, getGoogleProvider as googleProvider };
export default getFirebaseApp;
