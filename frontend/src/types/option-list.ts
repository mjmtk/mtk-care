export interface OptionListItem {
  id: number | string;
  label: string;
  slug: string;
  value?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export type OptionListType = 
  | 'referral-types'
  | 'referral-priorities' 
  | 'referral-statuses'
  | 'referral-service-types'
  | 'referral-service-providers'
  | 'client-statuses'
  | 'languages'
  | 'document-types'
  | 'contact-phone-types'
  | 'contact-email-types'
  | 'ethnicity'
  | 'pronouns'
  | 'primary-identity'
  | 'secondary-identity';