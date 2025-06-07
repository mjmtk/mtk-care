import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  
  // Development performance optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Only apply webpack config when NOT using turbo mode
    ...(process.env.TURBOPACK !== '1' && {
      webpack: (config, { dev, isServer }) => {
        if (dev && !isServer) {
          // Optimize webpack for faster development builds
          config.optimization = {
            ...config.optimization,
            removeAvailableModules: false,
            removeEmptyChunks: false,
            splitChunks: false,
          };
        }
        return config;
      },
    }),
    experimental: {
      // Turbopack configuration for when using --turbo flag
      turbo: {
        rules: {
          '*.svg': {
            loaders: ['@svgr/webpack'],
            as: '*.js',
          },
        },
      },
    },
  }),
  
  async rewrites() {
    // Use local backend in development mode, production backend otherwise
    const isProduction = process.env.NODE_ENV === 'production';
    const backendUrl = isProduction 
      ? 'https://mtkcare-backend-abbffge3c9gqcqhr.newzealandnorth-01.azurewebsites.net' 
      : 'http://localhost:8000';
      
    return [
      // Original generic proxy rule
      {
        // This regex source means:
        // - Starts with /api/
        // - Followed by any characters (:path*)
        // - BUT the path part must NOT start with 'auth/'
        source: '/api/:path((?!auth/).*)',
        destination: `${backendUrl}/api/:path`,
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
