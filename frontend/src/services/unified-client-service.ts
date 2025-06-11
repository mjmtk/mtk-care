/**
 * Unified client service that handles both real API clients and mock data
 */
import { Client as ClientType, TimelineActivity } from '@/types/client';
import { NewClientService } from './new-client-service';
import { mockClientService } from './mock-client-service';
import type { components } from '@/types/openapi';

type ClientDetailSchema = components['schemas']['ClientDetailSchema'];

/**
 * Transform API client data to display client format
 */
function transformApiClientToDisplayClient(apiClient: ClientDetailSchema): ClientType {
  return {
    id: String(apiClient.id),
    firstName: apiClient.first_name,
    lastName: apiClient.last_name,
    preferredName: apiClient.preferred_name || undefined,
    nhiFacilityCode: 'Unknown', // Simplified - remove problematic field
    dateOfBirth: apiClient.date_of_birth,
    primaryLanguage: String(apiClient.primary_language?.name || 'Unknown'),
    interpreterNeeded: Boolean(apiClient.interpreter_needed),
    culturalIdentity: {
      primaryIdentity: 'Not specified' // Simplified
    },
    phone: apiClient.phone || undefined,
    email: apiClient.email || undefined,
    address: apiClient.address || undefined,
    assignedClinician: 'clinician-1', // TODO: Map from API when available
    _episodeResponsibleStaffIds: ['staff-1'], // TODO: Map from API when available
    riskLevel: 'low', // Simplified
    consentRequired: Boolean(apiClient.consent_required),
    incompleteDocumentation: Boolean(apiClient.incomplete_documentation)
  };
}

/**
 * Check if a client ID corresponds to a real API client or mock client
 */
function isRealClientId(id: string): boolean {
  // Real client IDs from the API are UUIDs or numeric (as strings)
  // Mock client IDs start with 'client-'
  return /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id) || /^\d+$/.test(id);
}

/**
 * Generate initial timeline activity for a newly created client
 */
function generateClientCreationActivity(client: ClientType): TimelineActivity {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    id: `creation-${client.id}`,
    type: 'administrative',
    title: 'Client Record Created',
    content: `Client record created for ${client.firstName} ${client.lastName}. Initial assessment and documentation completed. Ready for service delivery.`,
    author: 'System',
    program: '',
    date: today,
    staffMember: 'System Administrator'
  };
}

/**
 * Unified client service
 */
export const unifiedClientService = {
  /**
   * Get a client by ID - uses real API for new clients, mock service for template clients
   */
  async getClient(id: string): Promise<ClientType> {
    try {
      if (isRealClientId(id)) {
        console.log(`[UnifiedClientService] Fetching real client ${id} from API`);
        const apiClient = await NewClientService.getClient(id);
        return transformApiClientToDisplayClient(apiClient);
      } else {
        console.log(`[UnifiedClientService] Using mock client data for ${id}`);
        return await mockClientService.getClient(id);
      }
    } catch (error) {
      console.error(`[UnifiedClientService] Error fetching client ${id}:`, error);
      
      // Fallback to mock service if API fails
      console.log(`[UnifiedClientService] Falling back to mock service for ${id}`);
      return await mockClientService.getClient(id);
    }
  },

  /**
   * Get timeline activities for a client - creates minimal timeline for new clients, uses mock data for templates
   */
  async getTimelineActivities(clientId: string, filters?: {
    activityTypes?: string[];
    programId?: string;
  }): Promise<TimelineActivity[]> {
    try {
      if (isRealClientId(clientId)) {
        console.log(`[UnifiedClientService] Generating timeline for real client ${clientId}`);
        
        // For new real clients, we'll create a minimal timeline with just the creation entry
        // In the future, this would fetch real timeline data from the API
        const client = await unifiedClientService.getClient(clientId);
        const creationActivity = generateClientCreationActivity(client);
        
        let activities = [creationActivity];
        
        // Apply filters if provided
        if (filters?.activityTypes && filters.activityTypes.length > 0) {
          activities = activities.filter(activity => filters.activityTypes!.includes(activity.type));
        }
        
        return activities;
      } else {
        console.log(`[UnifiedClientService] Using mock timeline activities for template client ${clientId}`);
        return await mockClientService.getTimelineActivities(clientId, filters);
      }
    } catch (error) {
      console.error(`[UnifiedClientService] Error fetching timeline for client ${clientId}:`, error);
      // Fallback to empty timeline for real clients, mock timeline for template clients
      if (isRealClientId(clientId)) {
        return [];
      } else {
        return await mockClientService.getTimelineActivities(clientId, filters);
      }
    }
  },

  /**
   * Add a new timeline activity/note for a client
   */
  async addTimelineActivity(clientId: string, noteData: {
    type: 'clinical' | 'administrative';
    content: string;
    program?: string;
  }): Promise<TimelineActivity> {
    try {
      if (isRealClientId(clientId)) {
        console.log(`[UnifiedClientService] Adding timeline activity for real client ${clientId}`);
        
        // For real clients, we'll create the activity and store it locally for now
        // In the future, this would call the API to persist the note
        const newActivity: TimelineActivity = {
          id: `activity-${Date.now()}`,
          type: noteData.type,
          title: noteData.type === 'clinical' ? 'Progress note' : 'Administrative Note',
          content: noteData.content,
          author: noteData.type === 'clinical' ? 'Clinical Note' : 'Administrative Note',
          program: noteData.program || '',
          date: new Date().toISOString().split('T')[0],
          staffMember: 'Current User' // In real app, this would come from auth context
        };
        
        return newActivity;
      } else {
        console.log(`[UnifiedClientService] Adding timeline activity for template client ${clientId}`);
        return await mockClientService.createNote(clientId, noteData);
      }
    } catch (error) {
      console.error(`[UnifiedClientService] Error adding timeline activity for client ${clientId}:`, error);
      throw error;
    }
  },

  // Delegate other methods to mock service for now (these will be implemented when API endpoints are available)
  getPrograms: mockClientService.getPrograms,
  getEpisodes: mockClientService.getEpisodes,
  getOutcomeMeasures: mockClientService.getOutcomeMeasures,

  // These methods are used by other components but not yet implemented
  getCarePlans: async () => { return []; },
  getCareTeam: async () => { return []; },
  getDocuments: async () => { return []; },
  updateTimelineActivity: async () => { throw new Error('Not implemented'); },
  deleteTimelineActivity: async () => { throw new Error('Not implemented'); },
};