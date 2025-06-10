import { AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosInstance from './axios-client';

/**
 * Centralized API request utility supporting both session-based and token-based authentication.
 * - For Django session-protected endpoints, set `authMode: 'session'` (default).
 * - For token-based endpoints, set `authMode: 'token'` and provide an `accessToken`.
 *
 * API paths must be RELATIVE (do not prefix with /api).
 * 
 * URL PATTERN STANDARDS:
 * - Collection endpoints (lists): ALWAYS use trailing slash (e.g., 'v1/users/')
 * - Individual resources: NEVER use trailing slash (e.g., 'v1/users/123')
 * - Special actions: NEVER use trailing slash (e.g., 'v1/referrals/batch-dropdowns')
 * 
 * These patterns match our Django Ninja backend standards to prevent 404 errors.
 */
export type ApiRequestOptions = {
  /** Relative endpoint path (do not include /api) */
  url: string;
  /** HTTP method (default: 'get') */
  method?: AxiosRequestConfig['method'];
  /** Query params */
  params?: AxiosRequestConfig['params'];
  /** Request body (for POST, PUT, PATCH) */
  data?: AxiosRequestConfig['data'];
  /** Override default headers */
  headers?: AxiosRequestConfig['headers'];
  /**
   * Auth mode:
   * - 'session' (default): Use cookies (Django session)
   * - 'token': Use accessToken as Bearer
   */
  authMode?: 'session' | 'token';
  /** Access token (required if authMode is 'token') */
  accessToken?: string;
  /**
   * Optional: override axios instance (advanced)
   */
  customAxios?: typeof axiosInstance;
};

export async function apiRequest<T = any>(options: ApiRequestOptions): Promise<T> {
  const {
    url,
    method = 'get',
    params,
    data,
    headers = {},
    authMode = 'session',
    accessToken,
    customAxios,
  } = options;

  // Compose headers based on auth mode
  const finalHeaders = { ...headers };
  const instance = customAxios || axiosInstance;

  if (authMode === 'token') {
    if (!accessToken) {
      throw new Error('apiRequest: accessToken required for token-based requests');
    }
    
    const tokenToUse = accessToken;
    
    finalHeaders.Authorization = `Bearer ${tokenToUse}`;
  }
  // For session mode, axiosInstance is already configured with withCredentials: true

  // Enforce API path rule
  if (url.startsWith('/api')) {
    throw new Error(
      "apiRequest: 'url' must be relative and must NOT start with /api. Prefix is handled by API_BASE_URL."
    );
  }

  // Normalize the URL (ensure it starts with /)
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

  const config: AxiosRequestConfig = {
    url: normalizedUrl,
    method,
    params,
    data,
    headers: finalHeaders,
  };

  try {
    const response = await instance.request<T>(config);
    return response.data;
  } catch (error) {
    // No retry logic - API patterns should be consistent
    // If you get 404s, check that your URL follows the standards:
    // - Collections: 'v1/users/' (with trailing slash)
    // - Individual: 'v1/users/123' (no trailing slash)
    // - Actions: 'v1/referrals/batch-dropdowns' (no trailing slash)
    throw error;
  }
}
