// Runtime configuration utility
// This ensures environment variables are read at runtime, not build time

export function getRuntimeConfig() {
  return {
    // Firebase client config (public)
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    
    // Server-side config (private)
    server: {
      googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      nextAuthSecret: process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      allowedOrigins: process.env.ALLOWED_ORIGINS,
      nextPublicDomain: process.env.NEXT_PUBLIC_DOMAIN,
    },
    
    // Environment info
    nodeEnv: process.env.NODE_ENV,
  };
}

// For client-side usage, only return public config
export function getPublicRuntimeConfig() {
  const config = getRuntimeConfig();
  return {
    firebase: config.firebase,
    nodeEnv: config.nodeEnv,
  };
}