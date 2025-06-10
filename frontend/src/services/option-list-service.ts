import axiosInstance from '@/services/axios-client';
import { AxiosResponse } from 'axios';
import { OptionListItem, OptionListType } from '../types/option-list';

/**
 * Service for fetching option list items from the backend.
 * Implements caching and is easily mockable for tests.
 */
export class OptionListService {
  private static cache: Map<string, OptionListItem[]> = new Map();

  /**
   * Fetches option list items for a given type.
   * @param type The option list type (e.g., 'referral-types', 'referral-statuses', 'referral-priorities').
   * @param forceRefresh If true, ignores cache and fetches from API.
   * @returns Promise resolving to an array of OptionListItem.
   */
  public static async fetchOptionList(type: OptionListType, forceRefresh = false): Promise<OptionListItem[]> {
    // Check localStorage batch cache first for referral types
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem('referral_optionlists');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // 1 hour TTL (should match cache util)
          if (Date.now() - timestamp < 60 * 60 * 1000 && data) {
            // Map OptionListType to batch keys
            const batchMap: Record<string, string> = {
              'referral-types': 'referral_types',
              'referral-priorities': 'referral_priorities',
              'referral-statuses': 'referral_statuses',
              'referral-service-types': 'referral_service_types',
              'referral-service-providers': 'external_service_providers'
            };
            const batchKey = batchMap[type];
            if (batchKey && data[batchKey]) {
              return data[batchKey];
            }
          }
        }
      } catch {}
    }
    if (!forceRefresh && OptionListService.cache.has(type)) {
      return OptionListService.cache.get(type)!;
    }
    // API call using axiosInstance with relative URL
    const url = `v1/optionlists/${type}/items/`; // Updated to match backend API pattern
    try {
      const response: AxiosResponse<OptionListItem[]> = await axiosInstance.get(url);
      OptionListService.cache.set(type, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching option list for type ${type}:`, error);
      // Decide how to handle errors, e.g., return empty array or throw
      // if (error.response) { throw new Error(`API Error: ${parseApiError(error.response)}`); }
      return []; // Or re-throw error depending on desired behavior
    }
  }

  /**
   * Fetches all referral dropdown option lists in a single batch API call.
   * @param accessToken The authentication token for the request.
   * @returns Promise resolving to an object with keys for each dropdown (external_service_providers, referral_types, referral_priorities, referral_service_types, referral_statuses).
   */
  public static async fetchBatchOptionLists(): Promise<{
    external_service_providers: OptionListItem[];
    referral_types: OptionListItem[];
    referral_priorities: OptionListItem[];
    referral_service_types: OptionListItem[];
    referral_statuses: OptionListItem[];
    [key: string]: OptionListItem[];
  }> {
    const url = 'referrals/batch-optionlists/'; // Assumes VITE_API_BASE_URL in axiosInstance includes the /api prefix
    const response: AxiosResponse<any> = await axiosInstance.get(url);

    return response.data;
  }

  /**
   * Clears the option list cache (for testing or force reload scenarios).
   */
  public static clearCache() {
    OptionListService.cache.clear();
  }
}
