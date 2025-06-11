// Client-related types for the dashboard
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  nhiFacilityCode: string;
  dateOfBirth: string;
  primaryLanguage: string;
  interpreterNeeded: boolean;
  culturalIdentity?: {
    primaryIdentity?: string;
    iwiHapu?: string;
    spiritualNeeds?: string;
  };
  // New cultural identity fields (direct from backend)
  iwi_hapu?: string;
  spiritual_needs?: string;
  phone?: string;
  email?: string;
  address?: string;
  assignedClinician?: string;
  _episodeResponsibleStaffIds?: string[];
  riskLevel: 'high' | 'medium' | 'low';
  consentRequired: boolean;
  incompleteDocumentation: boolean;
  status?: string;
  notes?: string;
  // Emergency contacts
  emergencyContacts?: EmergencyContact[];
}

export interface EmergencyContact {
  id?: string;
  first_name: string;
  last_name: string;
  relationship?: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  priority_order: number;
}

export interface TimelineActivity {
  id: string;
  type: 'clinical' | 'administrative' | 'episode' | 'assessment';
  title: string;
  content: string;
  author: string;
  program?: string;
  date: string;
  staffMember: string;
}

export interface Program {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface Episode {
  id: string;
  clientId: string;
  programId: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  responsibleStaffIds: string[];
}

export interface OutcomeMeasure {
  id: string;
  clientId: string;
  measureType: string;
  score: number;
  date: string;
  hasRiskIndicators: boolean;
}