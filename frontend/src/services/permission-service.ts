import axiosInstance from './axios-client';

export interface Permission {
  id: number;
  codename: string;
  name: string;
  content_type: number;
}

export class PermissionService {
  /**
   * Fetch all permissions from the backend.
   * Relies on an established Django session.
   */
  static async getAllPermissions(): Promise<Permission[]> {
    try {
      const response = await axiosInstance.get<Permission[]>('/permissions/');
      return response.data;
    } catch (error: any) {
      console.error("Error fetching permissions:", error.response ? error.response.data : error.message);
      // Depending on desired error handling, you might re-throw or return empty array
      // For now, let's match the previous implicit behavior of apiFetch which might throw on network error
      // but would return data or throw based on apiFetch's own error handling for HTTP errors.
      // Axios throws for non-2xx responses by default.
      throw error; // Or return [] if that's preferred for non-critical failures.
    }
  }
}
