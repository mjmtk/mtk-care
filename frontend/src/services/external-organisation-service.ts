// NOTE: Django session-protected endpoints must NOT be called with an Authorization header.
// Use axiosInstance with session cookies only.
import { apiRequest } from './api-request';
// Simple type guard for API errors
const isApiError = (error: any): error is { response?: { data?: { detail?: string } } } => {
  return error && error.response && error.response.data;
};

// Define OrganisationContact locally if not available globally.
// Ideally, this would be in a shared types file (e.g., src/types/external-organisations.ts)
interface OrganisationContact {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string; // Fallback if first/last not present
  job_title?: string;
  emails?: Array<{ id: string; email: string; type: string; is_primary: boolean }>; // Added 'type'
  // Add other relevant fields as needed from the API response
}

const BASE_PATH = 'external-organisations';

/**
 * Fetches contacts for a specific external organisation.
 * @param organisationId The UUID of the external organisation.

 * @returns A promise that resolves to an array of organisation contacts.
 */
export async function fetchOrganisationContacts(
  organisationId: string,

): Promise<OrganisationContact[]> {
  if (!organisationId) {
    // For a dropdown, returning an empty array on missing ID might be preferred over an error.
    console.warn('fetchOrganisationContacts called without organisationId, returning empty array.');
    return Promise.resolve([]); 
  }
  try {
    const data = await apiRequest<OrganisationContact[]>({
      url: `${BASE_PATH}/${organisationId}/contacts/`
    });
    return data;
  } catch (error) {
    console.error('Error fetching organisation contacts:', error);
    if (isApiError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch organisation contacts');
    }
    throw error;
  }
}
