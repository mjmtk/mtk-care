// src/lib/apiConfig.ts

const getApiBaseUrl = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    const baseUrl = process.env.NEXT_PUBLIC_DEV_DJANGO_API_URL || 'http://localhost:8000';
    // Ensure the base URL includes /api for the axios instance
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  } else {
    // In production, use the specific environment variable for the deployed backend.
    // This MUST be set in your Azure Web App (frontend) configuration.
    const prodApiUrl = process.env.NEXT_PUBLIC_PROD_API_BASE_URL;
    if (!prodApiUrl) {
      console.error("PRODUCTION API URL NOT SET: NEXT_PUBLIC_PROD_API_BASE_URL is not defined. API calls will likely fail.");
      // Fallback to relative path, which might work if a proxy is manually configured,
      // but for separate Web Apps, an absolute URL is generally needed.
      return '/api'; 
    }
    // Ensure the production URL includes /api and doesn't have a trailing slash
    const baseUrl = prodApiUrl.endsWith('/') ? prodApiUrl.slice(0, -1) : prodApiUrl;
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  }
};

export const API_BASE_URL = getApiBaseUrl(); // e.g., http://localhost:8000 or ''

/**
 * Constructs the full API path for use with axiosInstance.
 * The axiosInstance has its baseURL set to API_BASE_URL which now includes /api.
 * This function should return the path segment that comes AFTER the baseURL.
 * Since baseURL now includes /api, this just returns the relative path.
 * @param relativePath The path relative to the API service (e.g., 'v1/users/me' or 'profile').
 *                     It should NOT start with '/'.
 * @returns Path to be used with axios (e.g., 'v1/profile')
 */
export const getApiPath = (relativePath: string): string => {
  if (relativePath.startsWith('/')) {
    // Ensure relativePath doesn't start with a slash if it's meant to be appended to a baseURL
    relativePath = relativePath.substring(1);
  }

  // Since API_BASE_URL now includes /api, we just return the relative path
  return relativePath;
};
