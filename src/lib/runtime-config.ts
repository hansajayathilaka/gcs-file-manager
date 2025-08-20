// Runtime configuration utility
// This ensures environment variables are read at runtime, not build time

// Function to get runtime environment variables from window object or process.env
function getRuntimeEnv(key: string): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side: get from window.__ENV__ or process.env
    return (window as any).__ENV__?.[key] || process.env[key];
  }
  // Server-side: get from process.env
  return process.env[key];
}

export function getRuntimeConfig() {
  return {
    // Firebase client config (public)
    firebase: {
      apiKey: getRuntimeEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
      authDomain: getRuntimeEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      projectId: getRuntimeEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
      storageBucket: getRuntimeEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getRuntimeEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getRuntimeEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
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