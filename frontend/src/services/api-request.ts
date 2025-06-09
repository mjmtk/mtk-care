import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import axiosInstance from './axios-client';
// import { tokenManager } from './token-manager'; // Removed - using simplified auth

// Cache for known URL patterns (to avoid retrying on every request)
const urlPatternCache = new Map<string, string>();

/**
 * Centralized API request utility supporting both session-based and token-based authentication.
 * - For Django session-protected endpoints, set `authMode: 'session'` (default).
 * - For token-based endpoints, set `authMode: 'token'` and provide an `accessToken`.
 *
 * API paths must be RELATIVE (do not prefix with /api).
 * 
 * TRAILING SLASH HANDLING:
 * This utility automatically handles Django Ninja's inconsistent trailing slash behavior.
 * If a request returns 404, it will retry with/without a trailing slash and cache
 * the working pattern for future requests to the same endpoint.
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
  let finalHeaders = { ...headers };
  let instance = customAxios || axiosInstance;

  if (authMode === 'token') {
    if (!accessToken) {
      throw new Error('apiRequest: accessToken required for token-based requests');
    }
    
    let tokenToUse = accessToken;
    
    finalHeaders = {
      ...finalHeaders,
      Authorization: `Bearer ${tokenToUse}`,
    };
  }
  // For session mode, axiosInstance is already configured with withCredentials: true

  // Enforce API path rule
  if (url.startsWith('/api')) {
    throw new Error(
      "apiRequest: 'url' must be relative and must NOT start with /api. Prefix is handled by API_BASE_URL."
    );
  }

  const config: AxiosRequestConfig = {
    url,
    method,
    params,
    data,
    headers: finalHeaders,
  };

  // Normalize the URL (ensure it starts with /)
  let normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  
  // Check cache for known URL pattern
  const cacheKey = `${method}:${normalizedUrl}`;
  const cachedUrl = urlPatternCache.get(cacheKey);
  if (cachedUrl) {
    config.url = cachedUrl;
  } else {
    config.url = normalizedUrl;
  }

  let response: AxiosResponse<T>;
  try {
    response = await instance.request<T>(config);
    // Cache successful URL pattern
    if (!cachedUrl) {
      urlPatternCache.set(cacheKey, config.url);
    }
  } catch (error: any) {
    // If we get a 404, try toggling the trailing slash
    if (error.response?.status === 404 && !cachedUrl) {
      const hasTrailingSlash = config.url.endsWith('/');
      const alternativeUrl = hasTrailingSlash 
        ? config.url.slice(0, -1)  // Remove trailing slash
        : `${config.url}/`;        // Add trailing slash
      
      console.log(`Got 404 for ${config.url}, trying ${alternativeUrl}`);
      
      try {
        config.url = alternativeUrl;
        response = await instance.request<T>(config);
        // Cache the working URL pattern
        urlPatternCache.set(cacheKey, alternativeUrl);
        console.log(`Success with ${alternativeUrl}, cached for future use`);
      } catch (retryError: any) {
        // If retry also fails, throw the original error
        throw error;
      }
    } else {
      // For non-404 errors or if we already tried from cache, just throw
      throw error;
    }
  }
  return response.data;
}
