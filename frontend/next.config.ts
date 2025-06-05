import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  async rewrites() {
    return [
      // Proxy API calls to Django backend, EXCLUDING /api/auth paths
      {
        // This regex source means:
        // - Starts with /api/
        // - Followed by any characters (:path*)
        // - BUT the path part must NOT start with 'auth/'
        source: '/api/:path((?!auth/).*)',
        destination: 'https://mtkcare-backend-abbffge3c9gqcqhr.newzealandnorth-01.azurewebsites.net/api/:path*',
      },
      // By excluding /api/auth/* from the proxy rule above,
      // Next.js's App Router will handle /api/auth/[...nextauth]/route.ts locally by default.
    ]
  },
  
  // Environment variables are accessed via process.env directly in App Router
  // publicRuntimeConfig: {
  //   NEXT_PUBLIC_DJANGO_API_URL: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api',
  //   NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  //   AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID,
  //   AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID,
  //   NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE: process.env.NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE,
  // },
  
  // serverRuntimeConfig: {
  //   NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  //   AZURE_AD_CLIENT_SECRET: process.env.AZURE_AD_CLIENT_SECRET,
  // },
  
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
