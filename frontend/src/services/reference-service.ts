import { apiRequest } from './api-request';

export interface ReferenceItem {
  id: string;
  name: string;
}

export class ReferenceService {
  static async fetchCountries(): Promise<ReferenceItem[]> {
    const url = 'reference/countries/';
    try {
      const data = await apiRequest<ReferenceItem[]>({ url });
      return data;
    } catch (error: any) {
      console.error("Error fetching countries:", error.response ? error.response.data : error.message);
      throw error; // Or return []
    }
  }

  static async fetchLanguages(): Promise<ReferenceItem[]> {
    const url = 'reference/languages/';
    try {
      const data = await apiRequest<ReferenceItem[]>({ url });
      return data;
    } catch (error: any) {
      console.error("Error fetching languages:", error.response ? error.response.data : error.message);
      throw error; // Or return []
    }
  }
}
