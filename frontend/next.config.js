/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'mtk-care.azurewebsites.net', 'mtk-care-staging.azurewebsites.net'],
  },
  async rewrites() {
    return [
      // Don't rewrite API routes
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Rewrite other API requests to the backend
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://backend:8000'}/api/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
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
}

module.exports = nextConfig
