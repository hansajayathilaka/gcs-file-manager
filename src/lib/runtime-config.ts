// Runtime configuration utility
// Server-side only - follows Next.js best practices

export function getServerConfig() {
  return {
    // Firebase server config (for Admin SDK)
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    },
    
    // Server-side config (private)
    server: {
      googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      nextAuthSecret: process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      allowedOrigins: process.env.ALLOWED_ORIGINS,
      publicDomain: process.env.PUBLIC_DOMAIN,
    },
    
    // Environment info
    nodeEnv: process.env.NODE_ENV,
  };
}

// Client config should be provided via API endpoint
// This ensures proper separation of concerns and follows Next.js patterns
export function getPublicConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
  };
}