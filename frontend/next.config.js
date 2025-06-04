/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // images: {
  //   domains: ['localhost', 'mtk-care.azurewebsites.net', 'mtk-care-staging.azurewebsites.net'],
  // },
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
   
   // Enable experimental features that help with deployment
   experimental: {
     // Helps with file tracing for standalone builds
     outputFileTracingRoot: process.cwd(),
   },
    // Ensure images work correctly
  images: {
    unoptimized: true, // Required for standalone builds in some cases
  },
   // Configure redirects if needed
   async redirects() {
     return []
   },
   
   // Configure rewrites if needed for API routes
   async rewrites() {
     return []
   }
}

module.exports = nextConfig
