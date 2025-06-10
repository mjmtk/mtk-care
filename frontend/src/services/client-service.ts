/**
 * Service for managing clients
 */
export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  date_of_birth: string;
  email: string | null;
  phone: string | null;
  status: string;
  pronoun: string | null;
  pronoun_other: string | null;
  primary_language: string;
  interpreter_needed: boolean;
  address_street: string | null;
  address_city: string | null;
  address_postcode: string | null;
  country_context: string | null;
  country_of_birth: string | null;
  iwi: string | null;
  cultural_groups: string[];
  cultural_group_other: string | null;
  ethnicities: string[];
  primary_identity: string;
  secondary_identities: string[];
  secondary_identity_other: string | null;
  nhi_facility_code: string;
  notes: string | null;
  gender: string;
  emergency: { name: string; phone: string }[];
  uploaded_documents: { type: string; name: string; size: number; status: string }[];
  bypass_reasons: Record<string, string>;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  latest_referral_id: number | null;
  latest_referral_status: string | null;
  latest_referral_status_display: string | null;
}



export interface ClientStatus {
  id: string;
  name: string;
  description: string;
}

export interface Language {
  id: string;
  name: string;
  code: string;
}

export interface Pronoun {
  id: string;
  value: string;
  display_name: string;
}

export interface ClientCreateRequest {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  status: string;
  primary_language: string;
  pronoun: string;
  interpreter_needed: boolean;
  address: string;
  nhi_facility_code: string;
  uploaded_documents: string[];
  bypass_reasons?: Record<string, string>;
}

import { buildQueryString } from './service-utils'; // Removed getApiBaseUrl, parseApiError
import { apiRequest } from './api-request';

export interface ClientBatchDropdowns {
  client_statuses: { id: string; label: string; slug: string; sort_order: number }[];
  pronouns: { id: string; label: string; slug: string; sort_order: number }[];
  languages: { id: string | number; label: string; code: string }[];
  ethnicities: { id: string; label: string; slug: string; sort_order: number }[];
  primary_identities: { id: string; label: string; slug: string; sort_order: number }[];
  client_required_documents: { id: string; slug: string; label: string }[];
  bypass_reasons?: { id: string; slug: string; label: string }[];
  secondary_identities: { id: string; label: string; slug: string; sort_order: number }[];
  cultural_groups: { id: string | number; label: string }[];
  countries: { id: string | number; label: string; code: string }[];
}

export class ClientService {
  /**
   * Fetch all dropdown values for client creation in a single batch request.
   * Relies on an established Django session.
   */
  static async getBatchDropdowns(): Promise<ClientBatchDropdowns> {
    const url = 'optionlists/client-batch-dropdowns';
    try {
      const data = await apiRequest<ClientBatchDropdowns>({ url });
      // Validate that all expected keys exist
      const keys = [
        'client_statuses',
        'pronouns',
        'languages',
        'ethnicities',
        'primary_identities',
        'secondary_identities',
        'cultural_groups',
        'countries',
      ];
      for (const key of keys) {
        if (!(key in data)) {
          console.error(`[ClientService.getBatchDropdowns] Missing key '${key}' in response:`, data);
          throw new Error(`Batch dropdowns API response missing required key: ${key}`);
        }
      }
      // Transform items to ensure 'label' property exists, mapping from 'name' if necessary
      const transformItem = (item: any) => ({
        ...item,
        label: item.name || item.label, // Prioritize item.name if it exists, fallback to item.label
      });

      // Apply transformation to relevant fields
      // Based on ClientBatchDropdowns interface and observed API responses
      if (data.pronouns) data.pronouns = data.pronouns.map(transformItem);
      if (data.languages) data.languages = data.languages.map(transformItem);
      if (data.ethnicities) data.ethnicities = data.ethnicities.map(transformItem);
      if (data.primary_identities) data.primary_identities = data.primary_identities.map(transformItem);
      if (data.secondary_identities) data.secondary_identities = data.secondary_identities.map(transformItem);
      if (data.cultural_groups) data.cultural_groups = data.cultural_groups.map(transformItem);
      if (data.countries) data.countries = data.countries.map(transformItem);

      return data;
    } catch (error: any) {
      console.error('[ClientService.getBatchDropdowns] Exception:', error);
      // Consider re-throwing a more specific error or handling it based on error.response
      throw error;
    }
  }

  /**
   * Get all clients with optional filtering.
   * Relies on an established Django session.
   */
  static async getClients(
    statusId?: string,
    primaryLanguageId?: string,
    interpreterNeeded?: boolean,
    search?: string,
    ordering?: string
  ): Promise<Client[]> {
    try {
      const queryString = buildQueryString({
        status: statusId,
        primary_language: primaryLanguageId,
        interpreter_needed: interpreterNeeded,
        search,
        ordering,
      });
      const url = `client-management/${queryString}`;
      const data = await apiRequest<Client[]>({ url });
      return data;
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      // if (error.response) { throw new Error(`API Error: ${parseApiError(error.response)}`); }
      return [];
    }
  }

  /**
   * Get a single client by ID.
   * Relies on an established Django session.
   */
  static async getClientById(clientId: string): Promise<Client | null> {
    try {
      const data = await apiRequest<Client>({ url: `clients/${clientId}` });
      return data;
    } catch (error: any) {
      console.error(`Error fetching client ${clientId}:`, error);
      if (error.response && error.response.status === 404) {
        return null; 
      }
      return null; 
    }
  }

  /**
   * Search for clients.
   * Relies on an established Django session.
   */
  static async searchClients(searchTerm: string): Promise<Client[]> {
    try {
      const url = `client-management/?search=${encodeURIComponent(searchTerm)}`;
      const data = await apiRequest<Client[]>({ url });
      return data;
    } catch (error: any) {
      console.error("Error searching clients:", error);
      // if (error.response) { throw new Error(`API Error: ${parseApiError(error.response)}`); }
      return [];
    }
  }

  /**
   * Create a new client.
   * Relies on an established Django session.
   */
  static async createClient(clientData: ClientCreateRequest): Promise<Client> {
    try {
      const data = await apiRequest<Client>({ url: 'v1/clients/', method: 'post', data: clientData });
      if (!data || !data.id) { // Basic validation
        console.error('[ClientService.createClient] API contract error: invalid response from client creation API:', data);
        throw new Error('API contract error: invalid response from client creation API. Please contact support.');
      }
      return data;
    } catch (error: any) {
      console.error('[ClientService.createClient] Exception:', error);
      // Consider re-throwing a more specific error or handling based on error.response
      throw error; // Re-throw to allow calling code to handle
    }
  }

  /**
   * Update an existing client.
   * Relies on an established Django session.
   */
  static async updateClient(clientId: string, clientData: Partial<ClientCreateRequest>): Promise<Client | null> {
    try {
      const data = await apiRequest<Client>({ url: `clients/${clientId}`, method: 'patch', data: clientData });
      return data;
    } catch (error: any) {
      console.error(`Error updating client ${clientId}:`, error);
      // if (error.response && error.response.status === 404) { return null; } // Example specific error handling
      // Original returns null on error. Maintain this pattern.
      return null;
    }
  }

  /**
   * Link client to referral.
   * Relies on an established Django session.
   */
  static async linkClientToReferral(clientId: string, referralId: string): Promise<boolean> {
    try {
      await apiRequest({ url: `clients/${clientId}/link_to_referral`, method: 'post', data: { referral_id: referralId } });
      return true;
    } catch (error: any) {
      console.error(`Error linking client ${clientId} to referral ${referralId}:`, error);
      return false;
    }
  }

  /**
   * Get a single client by ID.
   * Relies on an established Django session.
   */
  static async getClient(id: string): Promise<Client> {
    try {
      const data = await apiRequest<Client>({ url: `v1/clients/${id}/` });
      return data;
    } catch (error: any) {
      console.error(`Error fetching client ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all client statuses.
   * Relies on an established Django session.
   */
  static async getClientStatuses(): Promise<ClientStatus[]> {
    try {
      const data = await apiRequest<ClientStatus[]>({ url: 'client-statuses' });
      return data;
    } catch (error: any) {
      console.error("Error fetching client statuses:", error);
      // if (error.response) { throw new Error(`API Error: ${parseApiError(error.response)}`); }
      return [];
    }
  }

  /**
   * Get all languages.
   * Relies on an established Django session.
   */
  static async getLanguages(): Promise<Language[]> {
    try {
      const data = await apiRequest<Language[]>({ url: 'languages' });
      return data;
    } catch (error: any) {
      console.error("Error fetching languages:", error);
      // if (error.response) { throw new Error(`API Error: ${parseApiError(error.response)}`); }
      return [];
    }
  }

  /**
   * Get all pronouns.
   * Relies on an established Django session.
   */
  static async getPronouns(): Promise<Pronoun[]> {
    try {
      const data = await apiRequest<Pronoun[]>({ url: 'pronouns' });
      return data;
    } catch (error: any) {
      console.error("Error fetching pronouns:", error);
      // if (error.response) { throw new Error(`API Error: ${parseApiError(error.response)}`); }
      return [];
    }
  }
}
