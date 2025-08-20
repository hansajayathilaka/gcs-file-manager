import type { NextConfig } from "next";

// Function to get runtime config values
function getRuntimeEnvValue(key: string, defaultValue: string) {
  return process.env[key] || defaultValue;
}

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@google-cloud/storage'],
  // Configure allowed hosts
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Add host validation
          {
            key: 'Access-Control-Allow-Origin',
            value: getRuntimeEnvValue('ALLOWED_ORIGINS', 'localhost:3000'),
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.run.app', getRuntimeEnvValue('NEXT_PUBLIC_DOMAIN', 'localhost:3000')]
    }
  },
  // Optimize images
  images: {
    domains: ['storage.googleapis.com', 'storage.cloud.google.com'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false // Enable optimization for better performance
  },
};

export default nextConfig;
