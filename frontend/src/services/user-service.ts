// Note: This file is commented out - AppRoles replaced with string roles
// import { apiRequest } from './api-request';
// import { isApiError } from '@/types/manual/common/api';

// export interface User {
//   id: string;
//   is_active?: boolean; // true if user can log in, false if just Azure user
//   // or is_activated?: boolean; // use if that's the backend field

//   username: string;
//   email: string;
//   first_name: string;
//   last_name: string;
//   is_superuser: boolean;
//   groups: { id: number; name: string }[];
//   permissions: string[];
//   onboarding_status: string | null;
//   roles: string[]; // mapped from groups
//   displayName: string; // for table display
//   // Optionally, add any other fields you want to show in the dialog
// }


// /**
//  * Service for managing users
//  */
// import { CurrentUser } from '@/types/user';

// export interface AzureUser {
//   id: number;
//   azure_id: string;
//   user_principal_name: string;
//   display_name: string;
//   email: string;
//   first_name: string;
//   last_name: string;
//   is_active: boolean;
//   last_sync: string | null;
//   is_activated: boolean;
//   activated_user_id: number | null;
//   job_title: string | null;
//   department: string | null;
//   company_name: string | null;
//   employee_id: string | null;
// }

// export class UserService {
//   /**
//    * Get all Azure users for admin activation
//    * 
//    * @param pageSize Number of users per page
//    * @param page Page number (0-based)
//    * @param searchQuery Optional search string
//    */
//   static async getAzureUsers(
    
//     pageSize: number = 10,
//     page: number = 0,
//     searchQuery?: string
//   ): Promise<{ users: AzureUser[], totalCount: number }> {
//     try {
//       const data = await apiRequest<any>({
//         url: 'azure-users/',
//         params: {
//           page: page + 1,
//           page_size: pageSize,
//           ...(searchQuery && { search: searchQuery })
//         }
//       });
//       return {
//         users: data.results || [],
//         totalCount: data.count || 0,
//       };
//     } catch (error) {
//       console.error('Error fetching Azure users:', error);
//       if (isApiError(error)) {
//         throw new Error(error.response?.data?.detail || 'Failed to fetch Azure users');
//       }
//       throw error;
//     }
//   }

//   /**
//    * Batch activate Azure users for app access
//    * 
//    * @param azureIds Array of Azure user IDs
//    */
//   static async activateAzureUsers( azureIds: string[]): Promise<any[]> {
//     try {
//       const data = await apiRequest<any>({
//         url: 'azure-users/activate/',
//         method: 'post',
//         data: { azure_ids: azureIds },
//         headers: { 'Content-Type': 'application/json' }
//       });
//       return data;
//     } catch (error) {
//       console.error('Error activating users:', error);
//       if (isApiError(error)) {
//         throw new Error(error.response?.data?.detail || 'Failed to activate users');
//       }
//       throw error;
//     }
//   }

//   static async deactivateAzureUsers( azureIds: string[]): Promise<any[]> {
//     try {
//       const data = await apiRequest<any>({
//         url: 'azure-users/deactivate/',
//         method: 'post',
//         data: { azure_ids: azureIds },
//         headers: { 'Content-Type': 'application/json' }
//       });
//       return data;
//     } catch (error) {
//       console.error('Error deactivating users:', error);
//       if (isApiError(error)) {
//         throw new Error(error.response?.data?.detail || 'Failed to deactivate users');
//       }
//       throw error;
//     }
//   }

//   /**
//    * Get all users from the Django backend
//    * 
//    * @param pageSize Number of users per page
//    * @param page Page number (0-based)
//    * @param searchQuery Optional search string
//    * @returns Array of users and total count
//    */
//   static async getUsers(
    
//     pageSize: number = 10,
//     page: number = 0, // 0-indexed for UI, backend is 1-indexed
//     searchQuery?: string
//   ): Promise<{ users: User[], totalCount: number }> {
//     const params: Record<string, any> = {
//       page_size: pageSize,
//       page: page + 1, // Adjust for 1-indexed backend pagination
//     };
//     if (searchQuery) {
//       params.search = searchQuery;
//     }
//     try {
//       // Build query string from params
//       const queryParams = new URLSearchParams();
//       if (params.page) queryParams.append('page', params.page.toString());
//       if (params.page_size) queryParams.append('page_size', params.page_size.toString());
//       if (params.search) queryParams.append('search', params.search);
      
//       const queryString = queryParams.toString();
//       const url = queryString ? `users/?${queryString}` : 'users/';
      
//       const data = await apiRequest<any>({ url });
//       return {
//         users: (data.results || []).map((user: any) => ({
//           id: String(user.id),
//           username: user.username || '',
//           email: user.email || '',
//           first_name: user.first_name || '',
//           last_name: user.last_name || '',
//           is_superuser: !!user.is_superuser,
//           groups: user.groups || [],
//           permissions: user.permissions || [],
//           onboarding_status: user.onboarding_status || null,
//           roles: (user.groups || []).map((g: any) => g.name) || [],
//           displayName: (user.first_name || user.last_name)
//             ? `${user.first_name} ${user.last_name}`.trim()
//             : user.username,
//         })),
//         totalCount: data.count || 0
//       };
//     } catch (error: any) {
//       console.error("Error fetching users:", error.response ? error.response.data : error.message);
//       // To match previous behavior of returning empty on error:
//       return {
//         users: [],
//         totalCount: 0
//       };
//       // Or to be more explicit about failures:
//       // throw error;
//     }
//   }
  
//   /**
//    * Get a single user by ID from the Django backend
//    * 
//    * @param userId User ID
//    * @returns User object
//    */
//   static async getUserById( userId: string): Promise<User> {
//     try {
//       const data = await apiRequest<any>({ url: `users/${userId}/` });
//       // Map the response to ensure it conforms to the User interface
//       const user = data;
//       return {
//         id: String(user.id),
//         username: user.username || '',
//         email: user.email || '',
//         first_name: user.first_name || '',
//         last_name: user.last_name || '',
//         is_superuser: !!user.is_superuser,
//         groups: user.groups || [],
//         permissions: user.permissions || [],
//         onboarding_status: user.onboarding_status || null,
//         roles: (user.groups || []).map((g: any) => g.name) || [],
//         displayName: (user.first_name || user.last_name)
//           ? `${user.first_name} ${user.last_name}`.trim()
//           : user.username,
//         // Ensure all fields from User interface are mapped
//         is_active: user.is_active, // Assuming backend provides this
//       };
//     } catch (error: any) {
//       console.error(`Error fetching user ${userId}:`, error.response ? error.response.data : error.message);
//       throw error;
//     }
//   }
  
//   /**
//    * Assign roles to a user
//    * 
//    * @param userId User ID
//    * @param roles Roles to assign
//    */
//   static async assignRolesToUser( userId: string, roles: string[]) {
//     try {
//       // The apiFetch will throw an error if the request fails
//       await apiRequest({
//         url: `users/${userId}/roles/`,
//         method: 'post',
//         data: { roles },
//         headers: { 'Content-Type': 'application/json' }
//       });
      
//       // If we get here, the request was successful
//       return { success: true };
//     } catch (error) {
//       console.error('Error assigning roles:', error);
//       throw error;
//     }
//   }

//   /**
//    * Fetch the current user (with groups and permissions) from the backend.
//    * 
//    * @returns CurrentUser object
//    */
//   static async getCurrentUser(): Promise<CurrentUser> {
//     try {
//       console.log('[UserService] About to fetch current user...');
//       console.log('[UserService] Current cookies:', document.cookie);
      
//       const data = await apiRequest<CurrentUser>({ url: 'users/me/' });
//       console.log('[UserService] Successfully fetched current user:', data);
//       return data;
//     } catch (error: any) {
//       // Log and re-throw or handle more gracefully
//       console.error('[UserService] Failed to fetch current user:', error);
//       console.error('[UserService] Error details:', {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         headers: error.response?.headers,
//         config: error.config
//       });
      
//       if (error.response) {
//         // Error with a response object
//         // throw new Error(`Failed to fetch current user: ${parseApiError(error.response)}`);
//         throw new Error(`Failed to fetch current user: ${error.response}`);
//       } else if (error.request) {
//         // Request was made but no response was received
//         throw new Error('Failed to fetch current user: No response from server.');
//       } else {
//         // Something else happened in setting up the request
//         throw new Error(`Failed to fetch current user: ${error.message}`);
//       }
//     }
//   }
// }
