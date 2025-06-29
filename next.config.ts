import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.run.app']
    }
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
