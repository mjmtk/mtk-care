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
    primaryIdentity: string;
  };
  phone?: string;
  email?: string;
  address?: string;
  assignedClinician?: string;
  _episodeResponsibleStaffIds?: string[];
  riskLevel: 'high' | 'medium' | 'low';
  consentRequired: boolean;
  incompleteDocumentation: boolean;
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