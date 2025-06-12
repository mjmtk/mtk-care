import { apiRequest } from './api-request';

export interface EmergencyContact {
  id?: string;
  relationship_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  priority_order: number;
  relationship?: {
    id: number;
    label: string;
    slug: string;
  };
}

export class EmergencyContactsService {
  /**
   * Get all emergency contacts for a client
   */
  static async getClientEmergencyContacts(clientId: string): Promise<EmergencyContact[]> {
    return apiRequest<EmergencyContact[]>({
      url: `v1/clients/${clientId}/emergency-contacts`,
      method: 'GET',
    });
  }

  /**
   * Create a new emergency contact for a client
   */
  static async createEmergencyContact(clientId: string, contactData: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    return apiRequest<EmergencyContact>({
      url: `v1/clients/${clientId}/emergency-contacts`,
      method: 'POST',
      data: contactData,
    });
  }

  /**
   * Replace all emergency contacts for a client
   */
  static async replaceAllEmergencyContacts(clientId: string, contacts: Omit<EmergencyContact, 'id'>[]): Promise<EmergencyContact[]> {
    return apiRequest<EmergencyContact[]>({
      url: `v1/clients/${clientId}/emergency-contacts`,
      method: 'PUT',
      data: { emergency_contacts: contacts },
    });
  }

  /**
   * Delete a specific emergency contact
   */
  static async deleteEmergencyContact(clientId: string, contactId: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>({
      url: `v1/clients/${clientId}/emergency-contacts/${contactId}`,
      method: 'DELETE',
    });
  }

  /**
   * Update client's cultural identity fields
   */
  static async updateClientCulturalIdentity(clientId: string, culturalData: {
    cultural_identity?: Record<string, any>;
    primary_language_id?: number | null;
    interpreter_needed?: boolean;
    iwi_hapu_id?: number | null;
    spiritual_needs_id?: number | null;
  }): Promise<any> {
    console.log('EmergencyContactsService.updateClientCulturalIdentity called');
    console.log('Client ID:', clientId);
    console.log('Cultural data:', culturalData);
    
    const result = await apiRequest({
      url: `v1/clients/${clientId}/cultural-identity`,
      method: 'PATCH',
      data: culturalData,
    });
    
    console.log('Cultural identity API response:', result);
    return result;
  }
}