import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  async rewrites() {
    return [
      // Don't rewrite API routes
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ]
  },
  
  // Environment variables that will be available on the client side
  publicRuntimeConfig: {
    NEXT_PUBLIC_DJANGO_API_URL: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID,
    AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID,
    NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE: process.env.NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE,
  },
  
  // Environment variables for server-side only
  serverRuntimeConfig: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AZURE_AD_CLIENT_SECRET: process.env.AZURE_AD_CLIENT_SECRET,
  },
  
  // Disable static exports if you're using API routes
  trailingSlash: false,

  // Configure for production deployment
  compress: true,

  // Ensure images work correctly
  images: {
    unoptimized: true,
  },
  
  // Configure redirects if needed
  async redirects() {
    return []
  },
};

export default nextConfig;
