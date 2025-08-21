import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let configPromise: Promise<any> | null = null;

// Fetch Firebase config from API endpoint
function fetchFirebaseConfig(): Promise<any> {
  if (!configPromise) {
    configPromise = fetch('/api/config')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch Firebase configuration');
        }
        return response.json();
      })
      .catch(error => {
        console.error('Error fetching Firebase config:', error);
        // Fallback to environment variables for development
        return {
          firebase: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          }
        };
      });
  }
  return configPromise;
}

// Initialize Firebase synchronously with fallback config
function initializeFirebase(): FirebaseApp {
  if (app) return app;
  
  // For synchronous initialization, use fallback config first
  const fallbackConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };
  
  // Only initialize if we have valid config
  if (!fallbackConfig.apiKey || !fallbackConfig.projectId) {
    console.warn('Firebase configuration is missing. App may not work correctly.');
  }
  
  app = getApps().length === 0 ? initializeApp(fallbackConfig) : getApps()[0];
  
  // Asynchronously update with runtime config
  fetchFirebaseConfig().then(runtimeConfig => {
    if (runtimeConfig.firebase && app) {
      console.log('Firebase runtime config loaded:', Object.keys(runtimeConfig.firebase));
    }
  });
  
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
