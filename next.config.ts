import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/storage'],
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.run.app']
    }
  },
  // Disable telemetry for production builds
  telemetry: false,
  // Enable SWC minification for better performance
  swcMinify: true,
  // Optimize images
  images: {
    domains: ['storage.googleapis.com', 'storage.cloud.google.com'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false // Enable optimization for better performance
  },
  // Configure headers for security
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
        ],
      },
    ];
  },
};

export default nextConfig;
