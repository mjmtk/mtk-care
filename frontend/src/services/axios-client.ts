/**
 * Foundation Axios instance for consistent network calls.
 * Always pass accessToken from useAuth for authenticated endpoints.
 *
 * Usage:
 *   const { getAccessToken } = useAuth();
 *   const token = await getAccessToken();
 *   const response = await axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } });
 */
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Use Next.js environment variables - ensure /api is included
const getBaseUrl = () => {
  const url = process.env.NODE_ENV === 'development' 
    ? process.env.NEXT_PUBLIC_DJANGO_API_URL 
    : process.env.NEXT_PUBLIC_PROD_API_BASE_URL;
  
  // Ensure /api suffix is present for proper API routing
  return url?.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = getBaseUrl();
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Added for session authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get a cookie by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Add a request interceptor to include the CSRF token
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    // config.headers is an AxiosHeaders object in InternalAxiosRequestConfig
    config.headers.set('X-CSRFToken', csrfToken);
  }
  return config;
});

// Global token refresh function - will be set by auth provider
let refreshTokenFunction: (() => Promise<string | null>) | null = null;

export const setTokenRefreshFunction = (fn: () => Promise<string | null>) => {
  refreshTokenFunction = fn;
};

// Track requests that are currently being retried to prevent infinite loops
const retryingRequests = new Set<string>();

// Add response interceptor for automatic token refresh on 401/403 errors
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if this is a 401/403 error and we haven't already retried this request
    if (error.response?.status === 401 || error.response?.status === 403) {
      const requestKey = `${originalRequest.method}-${originalRequest.url}`;
      
      // Prevent infinite retry loops
      if (originalRequest._retry || retryingRequests.has(requestKey)) {
        console.warn('Token refresh already attempted for this request, failing');
        return Promise.reject(error);
      }

      // Mark this request as being retried
      originalRequest._retry = true;
      retryingRequests.add(requestKey);

      try {
        console.log('Attempting token refresh due to 401/403 error');
        
        if (refreshTokenFunction) {
          const newToken = await refreshTokenFunction();
          
          if (newToken) {
            console.log('Token refreshed successfully, retrying original request');
            // Update the authorization header with the new token
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
            
            // Remove from retry tracking before making the request
            retryingRequests.delete(requestKey);
            
            // Retry the original request with the new token
            return axiosInstance(originalRequest);
          } else {
            console.warn('Token refresh failed - redirecting to login');
            // Token refresh failed, redirect to login or handle as needed
            retryingRequests.delete(requestKey);
            return Promise.reject(error);
          }
        } else {
          console.warn('No token refresh function available');
          retryingRequests.delete(requestKey);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Error during token refresh:', refreshError);
        retryingRequests.delete(requestKey);
        return Promise.reject(error);
      }
    }

    // For other errors, just pass them through
    return Promise.reject(error);
  }
);

export default axiosInstance;
