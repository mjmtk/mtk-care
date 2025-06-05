// src/lib/apiConfig.ts

const getApiBaseUrl = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    return process.env.NEXT_PUBLIC_DEV_DJANGO_API_URL || 'http://localhost:8000';
  } else {
    // In production, use the specific environment variable for the deployed backend.
    // This MUST be set in your Azure Web App (frontend) configuration.
    const prodApiUrl = process.env.NEXT_PUBLIC_PROD_API_BASE_URL;
    if (!prodApiUrl) {
      console.error("PRODUCTION API URL NOT SET: NEXT_PUBLIC_PROD_API_BASE_URL is not defined. API calls will likely fail.");
      // Fallback to relative path, which might work if a proxy is manually configured,
      // but for separate Web Apps, an absolute URL is generally needed.
      return ''; 
    }
    // Ensure the production URL doesn't have a trailing slash for consistency
    return prodApiUrl.endsWith('/') ? prodApiUrl.slice(0, -1) : prodApiUrl;
  }
};

export const API_BASE_URL = getApiBaseUrl(); // e.g., http://localhost:8000 or ''

/**
 * Constructs the full API path for use with axiosInstance.
 * The axiosInstance has its baseURL set to API_BASE_URL.
 * This function should return the path segment that comes AFTER the baseURL.
 * For SWA, where baseURL might be '', this means returning the full path like '/api/profile'.
 * For dev, where baseURL is 'http://localhost:8000', this also means returning '/api/profile'.
 * @param relativePath The path relative to the API service (e.g., 'profile' or 'users/1').
 *                     It should NOT start with '/'.
 * @returns Path to be used with axios (e.g., '/api/profile')
 */
export const getApiPath = (relativePath: string): string => {
  if (relativePath.startsWith('/')) {
    // Ensure relativePath doesn't start with a slash if it's meant to be appended to a baseURL
    relativePath = relativePath.substring(1);
  }

  // If API_BASE_URL is set (i.e., it's an absolute URL like https://mybackend.com),
  // the path for Axios should be relative to that base (e.g., 'api/v1/users/me').
  // If API_BASE_URL is empty (e.g., for SWA proxy or misconfiguration),
  // the path needs to be absolute from the host (e.g., '/api/v1/users/me').
  if (API_BASE_URL) {
    return `api/${relativePath}`; // Path relative to API_BASE_URL
  } else {
    return `/api/${relativePath}`; // Absolute path from the host
  }
};
