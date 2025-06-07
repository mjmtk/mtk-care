import { apiRequest } from './api-request';

// Service for searching service provider contacts
export interface ServiceProviderContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
}

export class ServiceProviderService {
  /**
   * Search for service provider contacts by name and optionally by provider id.
   * Relies on an established Django session.
   */
  static async searchContacts(
    name: string,
    _providerId?: string // providerId is not currently used in the URL construction
  ): Promise<ServiceProviderContact[]> {
    if (!name || name.length < 3) return [];

    const url = `serviceprovidercontacts/?search=${encodeURIComponent(name)}`;
    try {
      const data = await apiRequest<ServiceProviderContact[] | { results: ServiceProviderContact[] }>({ url });

      let contactsToCheck: ServiceProviderContact[] = [];
      if (Array.isArray(data)) {
        contactsToCheck = data;
      } else if (data && Array.isArray((data as { results: ServiceProviderContact[] }).results)) {
        contactsToCheck = (data as { results: ServiceProviderContact[] }).results;
      } else {
        // Unexpected response
        console.error('[ServiceProviderService.searchContacts] Unexpected API response format:', data);
        throw new Error('API contract error: Unexpected response format');
      }

      // Enforce 'id' contract
      for (const contact of contactsToCheck) {
        if (!('id' in contact) || contact.id === undefined || contact.id === null) { // More robust check for id
          console.error('[ServiceProviderService.searchContacts] Missing or invalid id in contact:', contact);
          throw new Error("API contract error: Contact is missing or has invalid 'id' property");
        }
      }
      return contactsToCheck;

    } catch (error: any) {
      console.error("[ServiceProviderService.searchContacts] Error:", error.response ? error.response.data : error.message);
      // Decide on error reporting: throw or return empty array
      // To match previous behavior of returning [] on fetch error:
      return []; 
      // Or to be more explicit about failures:
      // throw error;
    }
  }
}
