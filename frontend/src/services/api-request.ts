import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosInstance from './axios-client';
// import { tokenManager } from './token-manager'; // Removed - using simplified auth

/**
 * Centralized API request utility supporting both session-based and token-based authentication.
 * - For Django session-protected endpoints, set `authMode: 'session'` (default).
 * - For token-based endpoints, set `authMode: 'token'` and provide an `accessToken`.
 *
 * API paths must be RELATIVE (do not prefix with /api).
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

  let response: AxiosResponse<T>;
  try {
    response = await instance.request<T>(config);
  } catch (error: any) {
    // Optionally add global error handling/logging here
    throw error;
  }
  return response.data;
}
