import { apiRequest } from './api-request';
import type { components } from '@/types/openapi';

// Type aliases for cleaner code
type ClientDetailSchema = components['schemas']['ClientDetailSchema'];
type ClientListSchema = components['schemas']['ClientListSchema'];
type ClientCreateSchema = components['schemas']['ClientCreateSchema'];
type ClientUpdateSchema = components['schemas']['ClientUpdateSchema'];
type ClientStatsSchema = components['schemas']['ClientStatsSchema'];
type PagedClientListSchema = components['schemas']['PagedClientListSchema'];

export interface ClientSearchParams {
  search?: string;
  status_id?: string;
  risk_level?: string;
  primary_language_id?: string;
  interpreter_needed?: boolean;
  consent_required?: boolean;
  incomplete_documentation?: boolean;
  limit?: number;
  offset?: number;
}

export class NewClientService {
  /**
   * Search for clients with optional filters
   */
  static async searchClients(params: ClientSearchParams = {}): Promise<PagedClientListSchema> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `v1/clients/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return apiRequest({
      url,
      method: 'GET',
    });
  }

  /**
   * Get search suggestions for autocomplete
   */
  static async getSearchSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) return [];
    
    return apiRequest({
      url: `v1/clients/search/suggestions?query=${encodeURIComponent(query)}`,
      method: 'GET',
    });
  }

  /**
   * Create a new client
   */
  static async createClient(data: ClientCreateSchema): Promise<ClientDetailSchema> {
    return apiRequest({
      url: 'v1/clients/',
      method: 'POST',
      data,
    });
  }

  /**
   * Get client by ID
   */
  static async getClient(clientId: string): Promise<ClientDetailSchema> {
    return apiRequest({
      url: `v1/clients/${clientId}`,
      method: 'GET',
    });
  }

  /**
   * Update a client
   */
  static async updateClient(clientId: string, data: ClientUpdateSchema): Promise<ClientDetailSchema> {
    return apiRequest({
      url: `v1/clients/${clientId}`,
      method: 'PATCH',
      data,
    });
  }

  /**
   * Get client summary (lighter than full details)
   */
  static async getClientSummary(clientId: string): Promise<ClientListSchema> {
    return apiRequest({
      url: `v1/clients/${clientId}/summary`,
      method: 'GET',
    });
  }

  /**
   * Soft delete a client
   */
  static async deleteClient(clientId: string): Promise<{ message: string }> {
    return apiRequest({
      url: `v1/clients/${clientId}`,
      method: 'DELETE',
    });
  }

  /**
   * Get client statistics
   */
  static async getClientStats(): Promise<ClientStatsSchema> {
    return apiRequest({
      url: 'v1/clients/stats/overview',
      method: 'GET',
    });
  }

  /**
   * Validate client data without creating
   */
  static async validateClientData(data: ClientCreateSchema): Promise<{ message: string }> {
    return apiRequest({
      url: 'v1/clients/validate',
      method: 'POST',
      data,
    });
  }
}