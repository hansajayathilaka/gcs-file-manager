#!/usr/bin/env node
/**
 * Inject runtime environment variables into Next.js client bundle
 * This script runs at container startup to inject environment variables
 * that are available at runtime into the client-side code.
 */

const fs = require('fs');
const path = require('path');

// Environment variables to inject into client-side
const PUBLIC_ENV_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_DOMAIN'
];

function injectRuntimeEnv() {
  try {
    // Build the runtime environment object
    const runtimeEnv = {};
    PUBLIC_ENV_VARS.forEach(key => {
      if (process.env[key]) {
        runtimeEnv[key] = process.env[key];
      }
    });

    console.log('Injecting runtime environment variables:', Object.keys(runtimeEnv));

    // Create the injection script content
    const scriptContent = `
// Runtime environment variables injected at container startup
window.__ENV__ = ${JSON.stringify(runtimeEnv, null, 2)};
console.log('Runtime environment variables loaded:', window.__ENV__);
`;

    // Find the Next.js static directory
    const staticDir = path.join(process.cwd(), '.next/static');
    if (!fs.existsSync(staticDir)) {
      console.error('Next.js static directory not found. Make sure this runs after build.');
      process.exit(1);
    }

    // Write the environment script to static directory
    const envScriptPath = path.join(staticDir, 'runtime-env.js');
    fs.writeFileSync(envScriptPath, scriptContent);
    
    console.log(`Runtime environment script written to: ${envScriptPath}`);
    
    // Also write to public directory if it exists (for dev mode)
    const publicDir = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicDir)) {
      const publicEnvPath = path.join(publicDir, 'runtime-env.js');
      fs.writeFileSync(publicEnvPath, scriptContent);
      console.log(`Runtime environment script also written to: ${publicEnvPath}`);
    }

  } catch (error) {
    console.error('Error injecting runtime environment variables:', error);
    process.exit(1);
  }
}

// Run the injection
injectRuntimeEnv();