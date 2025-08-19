import type { NextConfig } from "next";

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
            value: process.env.ALLOWED_ORIGINS || 'localhost:3000',
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.run.app', process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000']
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
