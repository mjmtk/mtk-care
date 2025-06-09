import { AppRoles } from "@/types/auth";
import { apiRequest } from './api-request';
import type { UserProfile } from '../types/auth';

// Allow fetch to be injected for testability
const defaultFetch = (...args: Parameters<typeof fetch>) => fetch(...args); // Keep for getUserRoles

/**
 * Service for interacting with the Django backend authentication API
 */
export class AuthService {

  /**
   * Get user profile from Django backend.
   * Relies on an established Django session.
   * @returns User profile data
   */
  static async getUserProfile(): Promise<UserProfile> {
    try {
      const data = await apiRequest<UserProfile>({ url: 'user/me' });
      // Optionally, add runtime validation here if data is not strictly UserProfile
      return data;
    } catch (error: any) {
      console.warn("Error fetching user profile from Django backend:", error.response ? error.response.data : error.message);
      // Return a fallback profile with isFallback flag
      return {
        roles: [AppRoles.Administrator],
        displayName: "Administrator (Default)",
        email: "admin@example.com",
        isFallback: true
      };
    }
  }

  /**
   * Get roles for a user from MS Graph API
   * @param token Authentication token
   * @param userId User ID (optional)
   * @returns Array of roles
   */
  /**
   * Get roles for a user from MS Graph API
   * @param token Authentication token
   * @param userId User ID (optional)
   * @param fetchImpl Optionally inject fetch for testability
   * @returns Array of roles
   */
  static async getUserRoles(token: string, userId?: string, fetchImpl: typeof fetch = defaultFetch): Promise<AppRoles[]> {
    try {
      // First get the user profile from MS Graph API
      const headers = new Headers();
      headers.append("Authorization", `Bearer ${token}`);

      const options = {
        method: "GET",
        headers: headers,
      };

      // Get user info from Graph API
      let userInfo;
      const endpoint = userId
        ? `https://graph.microsoft.com/v1.0/users/${userId}`
        : "https://graph.microsoft.com/v1.0/me";

      const response = await fetchImpl(endpoint, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching user data:", errorData);
        throw new Error(`Failed to fetch user data: ${errorData.error.message}`);
      }
      
      userInfo = await response.json();
      
      if (!userInfo) {
        console.error("No user information found");
        return [];
      }
      
      console.log("User data from Graph API:", userInfo);
      
      // Assign roles based on display name matching the Azure AD screenshot
      const roles: AppRoles[] = [];
      const displayName = userInfo.displayName;
      
      if (displayName === "Aftab Jalal") {
        // Assign Administrator role to Aftab
        roles.push(AppRoles.Administrator);
      } else if (displayName === "Tashi") {
        // Assign OrganisationExecutive role to Tashi
        roles.push(AppRoles.ProgramManager); // Was OrganisationExecutive, which is not defined
      } else if (displayName === "Caleb") {
        // Assign Caseworker role to Caleb
        roles.push(AppRoles.Caseworker);
      }
      
      // For any other users or if no matching name was found, assign a default role
      if (roles.length === 0) {
        console.log("User not recognized, assigning Caseworker role for testing");
        roles.push(AppRoles.Caseworker);
      }
      
      console.log("Assigned roles for user:", roles);
      return roles;
    } catch (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
  }

  /**
   * Exchanges an MSAL ID token for a Django session.
   * @param msalIdToken The MSAL ID token obtained after successful MSAL authentication.
   * @returns Promise resolving if the session is established, or rejecting on error.
   */
  static async establishDjangoSession(msalIdToken: string): Promise<void> {
    const endpoint = 'auth/msal/login/'; // Relative path as per API Endpoint Construction Rule
    try {
      await apiRequest({ url: endpoint, method: 'post', data: { id_token: msalIdToken } });

      // Successful response (e.g., 200 OK or 204 No Content) indicates cookies are set.
      // The auth_flow.md mentions the backend sets HttpOnly cookies.
      console.log('Django session establishment request successful.');
      // No specific data needs to be returned from here, the cookies are the important part.
    } catch (error: any) {
      console.error(
        'Error establishing Django session:',
        error.response ? error.response.data : error.message
      );
      // Rethrow the error so the caller can handle it (e.g., update UI, retry MSAL login)
      throw error;
    }
  }
}
