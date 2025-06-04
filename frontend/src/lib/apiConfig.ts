// src/lib/apiConfig.ts (Revised)
const getApiBaseUrl = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devApiUrl = process.env.NEXT_PUBLIC_DEV_DJANGO_API_URL || 'http://localhost:8000';
  return isDevelopment ? devApiUrl : ''; // In prod, SWA handles proxy from root, so baseURL for axios can be relative to host
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
    console.warn('getApiPath: relativePath should not start with a slash. Auto-correcting.');
    relativePath = relativePath.substring(1);
  }
  return `/api/${relativePath}`; // Always returns a path like /api/profile or /api/users/1
};
