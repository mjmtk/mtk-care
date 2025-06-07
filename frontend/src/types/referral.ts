// Referral management types based on backend schemas

export interface OptionListItem {
  id: number;
  label: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export interface UserAudit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ReferralCreate {
  type_id: number;
  status_id: number;
  priority_id: number;
  service_type_id: number;
  reason: string;
  client_type: 'existing' | 'new' | 'self';
  // client_id?: string;  // Temporarily removed until client_management is implemented
  referral_date: string; // ISO date string
  accepted_date?: string;
  completed_date?: string;
  follow_up_date?: string;
  client_consent_date?: string;
  notes?: string;
  external_organisation_id?: string;
  external_organisation_contact_id?: string;
}

export interface ReferralUpdate {
  type_id?: number;
  status_id?: number;
  priority_id?: number;
  service_type_id?: number;
  reason?: string;
  client_type?: 'existing' | 'new' | 'self';
  // client_id?: string;  // Temporarily removed until client_management is implemented
  referral_date?: string;
  accepted_date?: string;
  completed_date?: string;
  follow_up_date?: string;
  client_consent_date?: string;
  notes?: string;
  external_organisation_id?: string;
  external_organisation_contact_id?: string;
}

export interface Referral {
  id: string;
  type: OptionListItem;
  status: OptionListItem;
  priority: OptionListItem;
  service_type: OptionListItem;
  reason: string;
  client_type: 'existing' | 'new' | 'self';
  // client_id?: string;  // Temporarily removed until client_management is implemented
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
  referral_types: OptionListItem[];
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