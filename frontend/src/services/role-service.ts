import { AppRoles } from "@/types/auth";

/**
 * Service for interacting with the Django backend for role management
 */
import { apiRequest } from './api-request';

export interface Role {
  id: number;
  name: string;
  permissions: number[];
}

export class RoleService {

  /**
   * Get all roles from the backend.
   * Relies on an established Django session.
   */
  static async getAllRoles(): Promise<Role[]> {
    try {
      const data = await apiRequest<Role[]>({ url: 'v1/roles/' });
      return data;
    } catch (error: any) {
      console.error("Error fetching all roles:", error.response ? error.response.data : error.message);
      throw error; // Or return []
    }
  }

  /**
   * Get roles for a user from the Django backend.
   * Relies on an established Django session.
   * @param userId User ID
   * @returns Array of roles
   */
  static async getUserRoles(userId: string): Promise<AppRoles[]> {
    try {
      // For debugging purposes
      console.log(`Fetching roles for user ${userId}`);
      const data = await apiRequest<{ roles: AppRoles[] }>({ url: `users/${userId}/roles` });
      console.log(`Roles for user ${userId}:`, data.roles);
      return data.roles;
    } catch (error: any) {
      console.error('Error fetching user roles:', error.response ? error.response.data : error.message);
      // If user doesn't exist in the backend yet, return default Caseworker role
      if (error.response && error.response.status === 404) {
        console.log(`User ${userId} not found in backend, using default Caseworker role`);
        return [AppRoles.Caseworker];
      }
      // Return default role if there's another error
      // Consider if specific error from parseApiError equivalent is needed or if console.error is enough
      // const parsedError = await parseApiError(error.response); // parseApiError expects a Fetch Response object
      // console.warn(`Error fetching user roles: ${parsedError.detail}`);
      return [AppRoles.Caseworker];
    }
  }

  /**
   * Assign roles to a user in the Django backend.
   * Relies on an established Django session.
   * @param userId User ID
   * @param roles Roles to assign
   */
  static async assignRolesToUser(userId: string, roles: AppRoles[]): Promise<void> {
    try {
      await apiRequest({ url: `users/${userId}/roles`, method: 'post', data: { roles } });
      // No specific data needs to be returned on success for POST, assuming 2xx is success
    } catch (error: any) {
      console.error('Error assigning roles to user:', error.response ? error.response.data : error.message);
      // const parsedError = await parseApiError(error.response); // parseApiError expects a Fetch Response object
      // throw new Error(`Error assigning roles to user: ${parsedError.detail}`);
      throw error; // Re-throw the Axios error object for the caller to handle
    }
  }

  /**
   * Remove a role from a user in the Django backend.
   * Relies on an established Django session.
   * @param userId User ID
   * @param roleId Role ID to remove (ensure this is the actual ID, not the role name/codename)
   */
  static async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await apiRequest({ url: `users/${userId}/roles/${roleId}`, method: 'delete' });
      // No specific data needs to be returned on success for DELETE, assuming 2xx is success
    } catch (error: any) {
      console.error('Error removing role from user:', error.response ? error.response.data : error.message);
      // const parsedError = await parseApiError(error.response); // parseApiError expects a Fetch Response object
      // throw new Error(`Error removing role from user: ${parsedError.detail}`);
      throw error; // Re-throw the Axios error object for the caller to handle
    }
  }
}
