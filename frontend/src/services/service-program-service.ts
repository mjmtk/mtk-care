// NOTE: Django session-protected endpoints must NOT be called with an Authorization header.
// Use axiosInstance with session cookies only.
import { apiRequest } from './api-request';

export interface ServiceProgramDropdownsResponse {
  service_types: Array<{ id: string; name: string }>;
  delivery_modes: Array<{ id: string; name: string }>;
  funding_agencies: Array<{ id: string; name: string }>;
  cultural_groups: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
  staff_roles: Array<{ id: string; name: string }>;
}

export const fetchServiceProgramDropdowns = async (): Promise<ServiceProgramDropdownsResponse> => {
  return apiRequest<ServiceProgramDropdownsResponse>({ url: 'service-programs/dropdowns' });
};
