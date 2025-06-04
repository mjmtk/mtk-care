/**
 * Centralized API request utility for making HTTP requests to the backend.
 * Primarily uses token-based authentication for v1 endpoints.
 *
 * API paths should be relative to the API root (e.g., 'v1/users/me', 'v1/roles').
 * The '/api' prefix is automatically added by `getApiPath` from `apiConfig.ts`.
 */
import { AxiosRequestConfig } from 'axios';
import axiosInstance from '@/lib/axiosClient';
import { getApiPath } from '@/lib/apiConfig';
import type { components } from '@/types/api'; // Adjusted import path for generated types

export type ApiRequestOptions<RequestBody = unknown> = {
  /** Relative endpoint path (e.g., 'v1/users/me') - version included */
  url: string;
  /** HTTP method (default: 'get') */
  method?: AxiosRequestConfig['method'];
  /** Query params */
  params?: AxiosRequestConfig['params'];
  /** Request body (for POST, PUT, PATCH) */
  data?: RequestBody;
  /** Override default headers */
  headers?: AxiosRequestConfig['headers'];
  /** Access token for Bearer authentication */
  accessToken?: string;
  /**
   * Optional: override axios instance (advanced)
   */
  customAxios?: typeof axiosInstance;
};

/**
 * Makes an API request using axios.
 * @param options Configuration for the request
 * @returns Promise resolving to the response data
 * @throws Error if the request fails
 */
export async function apiRequest<ResponseType = unknown, RequestBody = unknown>(
  options: ApiRequestOptions<RequestBody>
): Promise<ResponseType> {
  const {
    url, // Should include version, e.g., 'v1/users/me'
    method = 'get',
    params,
    data,
    headers = {},
    accessToken,
    customAxios,
  } = options;

  const instance = customAxios || axiosInstance;
  const requestHeaders: Record<string, string> = { ...headers };

  if (accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  // The getApiPath function prepends /api/ to the url
  // e.g. getApiPath('v1/users/me') returns '/api/v1/users/me'
  const fullPathForAxios = getApiPath(url);

  const config: AxiosRequestConfig = {
    url: fullPathForAxios, // This path is used by axiosInstance which has baseURL set
    method,
    params,
    data,
    headers: requestHeaders,
  };

  try {
    const response = await instance.request<ResponseType>(config);
    return response.data;
  } catch (error: unknown) {
    const errorData = error && typeof error === 'object' && 'response' in error 
      ? {
          status: (error as { response?: { status?: number } }).response?.status,
          data: (error as { response?: { data?: unknown } }).response?.data,
          message: (error as { message?: string }).message || 'Unknown error'
        }
      : { message: 'Unknown error' };

    console.error('API Request Error:', {
      url: fullPathForAxios,
      method,
      ...errorData
    });
    throw error;
  }
}

// --- Typed API Service Functions ---

/**
 * API service for user-related operations.
 */
export const usersApi = {
  /**
   * Fetches the current authenticated user's profile.
   * GET /api/v1/users/me/
   */
  getCurrentUserProfile: async (accessToken: string): Promise<components['schemas']['UserOut']> => {
    return apiRequest<components['schemas']['UserOut']>({
      url: 'v1/users/me/',
      method: 'get',
      accessToken,
    });
  },

  /**
   * Fetches a user by ID
   * GET /api/v1/users/{user_id}/
   */
  getUserById: async (userId: string, accessToken: string): Promise<components['schemas']['UserOut']> => {
    return apiRequest<components['schemas']['UserOut']>({
      url: `v1/users/${userId}/`,
      method: 'get',
      accessToken,
    });
  },

  /**
   * Updates a user's information
   * PATCH /api/v1/users/{user_id}/
   */
  updateUser: async (
    userId: string, 
    userData: components['schemas']['UserUpdate'],
    accessToken: string
  ): Promise<components['schemas']['UserOut']> => {
    return apiRequest<components['schemas']['UserOut'], components['schemas']['UserUpdate']>({
      url: `v1/users/${userId}/`,
      method: 'patch',
      data: userData,
      accessToken,
    });
  },

  /**
   * Activates a user account
   * POST /api/v1/users/{user_id}/activate/
   */
  activateUser: async (userId: string, accessToken: string): Promise<void> => {
    return apiRequest<void>({
      url: `v1/users/${userId}/activate/`,
      method: 'post',
      accessToken,
    });
  },

  /**
   * Deactivates a user account
   * POST /api/v1/users/{user_id}/deactivate/
   */
  deactivateUser: async (userId: string, accessToken: string): Promise<void> => {
    return apiRequest<void>({
      url: `v1/users/${userId}/deactivate/`,
      method: 'post',
      accessToken,
    });
  },

  /**
   * Updates a user's roles
   * PUT /api/v1/users/{user_id}/roles/
   */
  updateUserRoles: async (
    userId: string,
    roleIds: string[],
    accessToken: string
  ): Promise<components['schemas']['RoleOut'][]> => {
    return apiRequest<components['schemas']['RoleOut'][]>({
      url: `v1/users/${userId}/roles/`,
      method: 'put',
      data: { role_ids: roleIds },
      accessToken,
    });
  },

  /**
   * Lists all users (with pagination support)
   * GET /api/v1/users/
   */
  listUsers: async (
    accessToken: string,
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      is_active?: boolean;
    }
  ): Promise<{
    items: components['schemas']['UserOut'][];
    total: number;
    page: number;
    page_size: number;
  }> => {
    return apiRequest({
      url: 'v1/users/',
      method: 'get',
      params,
      accessToken,
    });
  },
};

/**
 * API service for role management
 */
export const rolesApi = {
  /**
   * Lists all available roles
   * GET /api/v1/roles/
   */
  listRoles: async (accessToken: string): Promise<components['schemas']['RoleOut'][]> => {
    const response = await apiRequest<{ results: components['schemas']['RoleOut'][] }>({
      url: 'v1/roles/',
      method: 'get',
      accessToken,
    });
    return response.results;
  },

  /**
   * Gets a role by ID
   * GET /api/v1/roles/{role_id}/
   */
  getRoleById: async (roleId: string, accessToken: string): Promise<components['schemas']['RoleOut']> => {
    return apiRequest<components['schemas']['RoleOut']>({
      url: `v1/roles/${roleId}/`,
      method: 'get',
      accessToken,
    });
  },

  /**
   * Creates a new role
   * POST /api/v1/roles/
   */
  createRole: async (
    roleData: components['schemas']['RoleCreate'],
    accessToken: string
  ): Promise<components['schemas']['RoleOut']> => {
    return apiRequest<components['schemas']['RoleOut'], components['schemas']['RoleCreate']>({
      url: 'v1/roles/',
      method: 'post',
      data: roleData,
      accessToken,
    });
  },

  /**
   * Updates a role
   * PATCH /api/v1/roles/{role_id}/
   */
  updateRole: async (
    roleId: string,
    roleData: components['schemas']['RoleUpdate'],
    accessToken: string
  ): Promise<components['schemas']['RoleOut']> => {
    return apiRequest<components['schemas']['RoleOut'], components['schemas']['RoleUpdate']>({
      url: `v1/roles/${roleId}/`,
      method: 'patch',
      data: roleData,
      accessToken,
    });
  },

  /**
   * Deletes a role
   * DELETE /api/v1/roles/{role_id}/
   */
  deleteRole: async (roleId: string, accessToken: string): Promise<void> => {
    return apiRequest<void>({
      url: `v1/roles/${roleId}/`,
      method: 'delete',
      accessToken,
    });
  },
};

// Export all API services in a single object for easier imports
export const api = {
  users: usersApi,
  roles: rolesApi,
};

// Keep the individual exports for backward compatibility
export default api;