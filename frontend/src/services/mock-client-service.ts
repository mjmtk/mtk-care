// Mock client service for prototype development
import { Client, TimelineActivity, Program, Episode, OutcomeMeasure } from '@/types/client';

// Mock data
const mockClient: Client = {
  id: 'client-1',
  firstName: 'Aroha',
  lastName: 'Wiremu',
  preferredName: 'Aro',
  nhiFacilityCode: 'AAA8401',
  dateOfBirth: '1987-07-07',
  primaryLanguage: 'Te Reo Māori',
  interpreterNeeded: false,
  culturalIdentity: {
    primaryIdentity: 'Māori'
  },
  phone: '+64 21 123 4567',
  email: 'aroha.wiremu@example.com',
  address: '123 Kauri Street, Auckland',
  assignedClinician: 'clinician-1',
  _episodeResponsibleStaffIds: ['staff-1', 'staff-2'],
  riskLevel: 'high',
  consentRequired: true,
  incompleteDocumentation: true
};

const mockPrograms: Program[] = [
  { id: 'program-1', name: 'Substance Use Recovery Program', status: 'active' },
  { id: 'program-2', name: 'Comprehensive Mental Health Program', status: 'active' },
  { id: 'program-3', name: 'Family Support Program', status: 'active' }
];

const mockEpisodes: Episode[] = [
  {
    id: 'episode-1',
    clientId: 'client-1',
    programId: 'program-1',
    status: 'active',
    startDate: '2024-03-07',
    responsibleStaffIds: ['staff-1', 'staff-2']
  },
  {
    id: 'episode-2',
    clientId: 'client-1',
    programId: 'program-2',
    status: 'active',
    startDate: '2024-02-01',
    responsibleStaffIds: ['staff-1']
  }
];

const mockTimelineActivities: TimelineActivity[] = [
  {
    id: 'activity-1',
    type: 'clinical',
    title: 'Progress note',
    content: 'Client arrived on time for therapy session. Client appears to be making progress with treatment goals. Client reported improved mood since last session. Client expressed frustration with current life circumstances. Provided psychoeducation on stress management techniques. Discussed relapse prevention strategies. Will follow up on referral to community resources.',
    author: 'Clinical Note',
    program: 'Substance Use Recovery Program',
    date: '2025-03-05',
    staffMember: 'David Patel'
  },
  {
    id: 'activity-2',
    type: 'assessment',
    title: 'Assessment',
    content: 'Discharge assessment indicates client has met primary treatment goals and is ready for step-down care. Assessment measured severity of substance use disorder and readiness for change. Recommendations and treatment plan have been documented in client record.',
    author: 'Discharge Substance-use',
    program: 'Comprehensive Mental Health Program',
    date: '2025-02-18',
    staffMember: 'Emma Wilson'
  },
  {
    id: 'activity-3',
    type: 'clinical',
    title: 'Progress note',
    content: 'Met with client for follow-up appointment. Client demonstrated improved coping strategies during session. Provided psychoeducation on stress management techniques. Will follow up on referral to community resources.',
    author: 'Clinical Note',
    program: 'Comprehensive Mental Health Program',
    date: '2025-02-13',
    staffMember: 'Ana Martinez'
  },
  {
    id: 'activity-4',
    type: 'administrative',
    title: 'Administrative Note',
    content: 'Completed administrative tasks related to client care. Updated treatment plan documentation. Processed program enrollment documentation. Updated billing information in system. All required documentation is now complete and up to date.',
    author: 'Administrative Note',
    program: 'Substance Use Recovery Program',
    date: '2025-02-10',
    staffMember: 'Aftab Jalal'
  },
  {
    id: 'activity-5',
    type: 'assessment',
    title: 'Assessment',
    content: 'Progress assessment showing positive outcomes in mental health indicators. Client demonstrates improved coping mechanisms and reduced symptom severity.',
    author: 'Progress Mental-health',
    program: '',
    date: '2025-02-01',
    staffMember: 'Ana Martinez'
  }
];

const mockOutcomeMeasures: OutcomeMeasure[] = [
  {
    id: 'outcome-1',
    clientId: 'client-1',
    measureType: 'Depression Scale',
    score: 15,
    date: '2025-01-15',
    hasRiskIndicators: true
  }
];

// Mock API functions
export const mockClientService = {
  getClient: async (id: string): Promise<Client> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockClient;
  },

  getTimelineActivities: async (clientId: string, filters?: {
    activityTypes?: string[];
    programId?: string;
  }): Promise<TimelineActivity[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let activities = [...mockTimelineActivities];
    
    if (filters?.activityTypes && filters.activityTypes.length > 0) {
      activities = activities.filter(activity => filters.activityTypes!.includes(activity.type));
    }
    
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getPrograms: async (): Promise<Program[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockPrograms;
  },

  getEpisodes: async (clientId: string): Promise<Episode[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockEpisodes.filter(episode => episode.clientId === clientId);
  },

  getOutcomeMeasures: async (clientId: string): Promise<OutcomeMeasure[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockOutcomeMeasures.filter(measure => measure.clientId === clientId);
  },

  createNote: async (clientId: string, noteData: {
    type: 'clinical' | 'administrative';
    content: string;
    program?: string;
  }): Promise<TimelineActivity> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
    
    // Add to mock data for subsequent requests
    mockTimelineActivities.unshift(newActivity);
    
    return newActivity;
  }
};