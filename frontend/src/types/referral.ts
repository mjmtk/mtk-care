// Referral management types based on backend schemas

export interface OptionListItem {
  id: number;
  label: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export interface ReferralTypeChoice {
  value: string;
  label: string;
}

export interface UserAudit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ReferralCreate {
  type: string;
  status_id: number;
  priority_id: number;
  service_type_id: number;
  reason: string;
  client_type: 'existing' | 'new' | 'self';
  client_id?: string;  // For existing clients
  referral_date: string; // ISO date string
  accepted_date?: string;
  completed_date?: string;
  follow_up_date?: string;
  client_consent_date?: string;
  notes?: string;
  external_organisation_id?: string;
  external_organisation_contact_id?: string;
  
  // New client fields (for when client_type is 'new')
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  gender_id?: number;
  
  // Cultural identity fields
  iwi_hapu_id?: number;
  spiritual_needs_id?: number;
  primary_language_id?: number;
  interpreter_needed?: boolean;
  
  // Emergency contacts and consent records
  emergency_contacts?: Array<{
    name: string;
    relationship_id: number;
    phone?: string;
    email?: string;
    is_primary: boolean;
  }>;
  consent_records?: Array<{
    consent_type_id: number;
    status: string;
    date_given?: string;
    notes?: string;
  }>;
}

export interface ReferralUpdate {
  type?: string;
  status_id?: number;
  priority_id?: number;
  service_type_id?: number;
  reason?: string;
  client_type?: 'existing' | 'new' | 'self';
  client_id?: string;  // For existing clients
  referral_date?: string;
  accepted_date?: string;
  completed_date?: string;
  follow_up_date?: string;
  client_consent_date?: string;
  notes?: string;
  external_organisation_id?: string;
  external_organisation_contact_id?: string;
  
  // New client fields (for when client_type is 'new')
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  gender_id?: number;
  
  // Cultural identity fields
  iwi_hapu_id?: number;
  spiritual_needs_id?: number;
  primary_language_id?: number;
  interpreter_needed?: boolean;
  
  // Emergency contacts and consent records
  emergency_contacts?: Array<{
    name: string;
    relationship_id: number;
    phone?: string;
    email?: string;
    is_primary: boolean;
  }>;
  consent_records?: Array<{
    consent_type_id: number;
    status: string;
    date_given?: string;
    notes?: string;
  }>;
}

export interface ReferralClient {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
}

export interface Referral {
  id: string;
  type: string;
  status: OptionListItem;
  priority: OptionListItem;
  service_type: OptionListItem;
  reason: string;
  client_type: 'existing' | 'new' | 'self';
  client_id?: string;  // For existing clients
  client?: ReferralClient;  // Client details when available
  referral_date: string;
  accepted_date?: string;
  completed_date?: string;
  follow_up_date?: string;
  client_consent_date?: string;
  notes?: string;
  external_organisation_id?: string;
  external_organisation_contact_id?: string;
  created_at: string;
  updated_at: string;
  created_by: UserAudit;
  updated_by: UserAudit;
}

export interface ReferralBatchDropdowns {
  referral_types: ReferralTypeChoice[];
  referral_statuses: OptionListItem[];
  referral_priorities: OptionListItem[];
  referral_service_types: OptionListItem[];
}

export interface ReferralStatusUpdate {
  status_id: number;
}

// List/filter types
export interface ReferralListParams {
  page?: number;
  limit?: number;
  type_id?: number;
  status_id?: number;
  priority_id?: number;
  service_type_id?: number;
  client_type?: string;
  referral_date_from?: string;
  referral_date_to?: string;
  search?: string;
}

export interface ReferralListResponse {
  items: Referral[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}