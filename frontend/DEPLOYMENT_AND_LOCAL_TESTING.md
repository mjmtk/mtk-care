# Deployment to Azure Static Web Apps & Local Testing Guide

This document outlines the configuration changes made to deploy this Next.js frontend to Azure Static Web Apps (SWA) and how to manage local development and testing, especially concerning API calls to the Django backend.

## Azure Static Web Apps Deployment Configuration

To ensure compatibility and proper functioning on Azure Static Web Apps with its hybrid Next.js support (preview), the following changes were implemented:

1.  **API Proxy to Django Backend:**
    *   Proxying of API calls from the frontend (e.g., `/api/users`) to the external Django backend is now managed by Azure Static Web Apps itself.
    *   This is configured in `frontend/staticwebapp.config.json` using a `routes` rule:
        ```json
        {
          "routes": [
            {
              "route": "/api/*",
              "rewrite": "YOUR_DEPLOYED_DJANGO_BACKEND_URL/api/*"
            }
          ],
          // ... other configurations
        }
        ```
    *   The `YOUR_DEPLOYED_DJANGO_BACKEND_URL` should be the actual URL of your live Django application.
    *   The corresponding API proxy rule was **removed** from `frontend/next.config.js`.

2.  **Global HTTP Headers:**
    *   Global HTTP security headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`) are now defined in `frontend/staticwebapp.config.json` under the `globalHeaders` section.
    *   The `async headers()` function was **removed** from `frontend/next.config.js`.

3.  **Next.js Configuration (`next.config.js`):**
    *   Retains Next.js specific configurations such as `output: 'standalone'`, `reactStrictMode`, `images` (if used), `publicRuntimeConfig`, `serverRuntimeConfig`.
    *   Rewrites for Next.js internal API routes like `/api/auth/*` (for NextAuth.js) remain in `next.config.js` to be handled by the Next.js runtime.

## Local Development & Testing Strategy

With the API proxy to Django removed from `next.config.js` (to align with SWA deployment), local development (`npm run dev`) requires a strategy to ensure frontend API calls can reach your local Django backend.

**Recommended Strategy: Conditional API Base URL**

This approach involves configuring your frontend API calls to use a full local Django URL during development and relative paths in production.

1.  **Setup (`src/lib/apiConfig.ts` or similar):**
    Create a utility to provide the correct API base URL:
    ```typescript
    // Example: src/lib/apiConfig.ts
    const getApiBaseUrl = (): string => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      // Ensure your local Django URL is correct.
      // This can also come from an environment variable like NEXT_PUBLIC_DEV_DJANGO_API_URL
      const devApiUrl = process.env.NEXT_PUBLIC_DEV_DJANGO_API_URL || 'http://localhost:8000'; // Adjust if your local Django runs elsewhere

      // In production, SWA proxies relative /api/* paths
      return isDevelopment ? devApiUrl : '';
    };

    export const API_BASE_URL = getApiBaseUrl();

    export const getApiPath = (path: string): string => {
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      // Ensures correct path construction for both dev (full URL) and prod (relative path)
      if (API_BASE_URL === '') {
        return `/${cleanPath}`; // e.g., /api/users
      }
      return `${API_BASE_URL}/${cleanPath}`; // e.g., http://localhost:8000/api/users
    };
    ```
    *   Set `NEXT_PUBLIC_DEV_DJANGO_API_URL` in your `.env.local` if you prefer, or hardcode your local Django URL.

2.  **Usage in API Calls:**
    Modify your frontend API fetching logic:
    ```typescript
    import { getApiPath } from '@/lib/apiConfig'; // Adjust import path

    async function fetchSomeData() {
      const response = await fetch(getApiPath('api/some-django-endpoint'));
      // ...
    }
    ```
    This ensures:
    *   **During local development (`npm run dev`):** Calls go to `http://localhost:8000/api/some-django-endpoint`.
    *   **In production (on SWA):** Calls go to `/api/some-django-endpoint`, which SWA proxies to your deployed Django backend.

### Alternative Local Testing Options (Less Recommended for this Setup)

1.  **Temporary `next.config.js` Proxy:**
    *   Temporarily add the Django proxy back to `next.config.js` for local development and remove/comment it out before committing.
    *   **Risk:** Forgetting to revert the change before deployment.

2.  **Azure Static Web Apps CLI (SWA CLI):**
    *   Use `swa start ./frontend --api-devserver-url http://localhost:8000` (adjust path and Django URL).
    *   The SWA CLI attempts to emulate the Azure environment and reads `staticwebapp.config.json`.
    *   **Caveat:** The SWA documentation notes that "SWA CLI local emulation and deployment" is an unsupported feature for Next.js with hybrid rendering, so emulation might not be perfectly accurate for all Next.js hybrid features.

This recommended strategy (Conditional API Base URL) provides a reliable way to handle API calls for both local development and production deployment on Azure Static Web Apps.
