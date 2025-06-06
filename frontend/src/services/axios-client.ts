/**
 * Foundation Axios instance for consistent network calls.
 * Always pass accessToken from useAuth for authenticated endpoints.
 *
 * Usage:
 *   const { getAccessToken } = useAuth();
 *   const token = await getAccessToken();
 *   const response = await axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } });
 */
import axios, { InternalAxiosRequestConfig } from 'axios';

// Use Next.js environment variables
const API_BASE_URL = process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_DJANGO_API_URL : process.env.NEXT_PUBLIC_DJANGO_API_URL;
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

export default axiosInstance;
