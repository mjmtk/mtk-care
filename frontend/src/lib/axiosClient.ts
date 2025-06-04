/**
 * Foundation Axios instance for consistent network calls.
 */
import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './apiConfig'; // Adapted to use our Next.js specific apiConfig

const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // This will be http://localhost:8000 or an empty string for SWA
  withCredentials: true, // Important for Django session auth if used, and for CSRF cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get a cookie by name
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') { // Guard for server-side rendering
    return null;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Add a request interceptor to include the CSRF token if available
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers.set('X-CSRFToken', csrfToken);
  }
  // Ensure the final URL is constructed correctly based on baseURL and request URL
  // If baseURL is empty (production on SWA), config.url should be absolute path like /api/profile
  // If baseURL is http://localhost:8000 (dev), config.url should be relative like /api/profile
  // Our apiConfig.getApiPath should handle this, so axiosInstance.request(getApiPath('profile'))
  // However, if we set baseURL, axios will prepend it. So, if API_BASE_URL from apiConfig is empty,
  // we want requests to be like axiosInstance.get('/api/profile').
  // If API_BASE_URL is 'http://localhost:8000', we want axiosInstance.get('/api/profile') to become 'http://localhost:8000/api/profile'.
  // The current setup with API_BASE_URL in apiConfig.ts and here should work if API_BASE_URL is always the *true* base (e.g. http://localhost:8000 or https://deployed.com)
  // and the paths passed to axios are /api/endpoint.
  // Let's adjust apiConfig.ts and this slightly for clarity.

  // The `baseURL` in axiosInstance will be either `http://localhost:8000` (dev) or empty (prod).
  // The `url` passed to `axiosInstance.get(url)` should then be `/api/profile`.
  // This is handled by getApiPath in apiConfig.ts.

  return config;
});

export default axiosInstance;
