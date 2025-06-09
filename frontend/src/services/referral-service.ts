import { apiRequest } from './api-request';
import type {
  Referral,
  ReferralCreate,
  ReferralUpdate,
  ReferralStatusUpdate,
  ReferralBatchDropdowns,
  ReferralListParams,
  ReferralListResponse,
} from '@/types/referral';

export class ReferralService {
  private static readonly BASE_PATH = 'v1/referrals';

  /**
   * Get list of referrals with optional filtering
   */
  static async getReferrals(params?: ReferralListParams): Promise<ReferralListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = queryParams.toString() 
      ? `${this.BASE_PATH}?${queryParams.toString()}`
      : `${this.BASE_PATH}`;

    return apiRequest<ReferralListResponse>({
      url,
      method: 'GET',
    });
  }

  /**
   * Get a specific referral by ID
   */
  static async getReferral(id: string): Promise<Referral> {
    return apiRequest<Referral>({
      url: `${this.BASE_PATH}/${id}`,
      method: 'GET',
    });
  }

  /**
   * Create a new referral
   */
  static async createReferral(data: ReferralCreate): Promise<Referral> {
    return apiRequest<Referral>({
      url: `${this.BASE_PATH}`,
      method: 'POST',
      data,
    });
  }

  /**
   * Update an existing referral
   */
  static async updateReferral(id: string, data: ReferralUpdate): Promise<Referral> {
    return apiRequest<Referral>({
      url: `${this.BASE_PATH}/${id}`,
      method: 'PUT',
      data,
    });
  }

  /**
   * Update only the status of a referral
   */
  static async updateReferralStatus(id: string, data: ReferralStatusUpdate): Promise<Referral> {
    return apiRequest<Referral>({
      url: `${this.BASE_PATH}/${id}/status`,
      method: 'PATCH',
      data,
    });
  }

  /**
   * Delete a referral
   */
  static async deleteReferral(id: string): Promise<void> {
    return apiRequest<void>({
      url: `${this.BASE_PATH}/${id}`,
      method: 'DELETE',
    });
  }

  /**
   * Get all dropdown options for referral forms
   */
  static async getBatchDropdowns(): Promise<ReferralBatchDropdowns> {
    return apiRequest<ReferralBatchDropdowns>({
      url: `${this.BASE_PATH}/batch-dropdowns/`,
      method: 'GET',
    });
  }

  /**
   * Search referrals by text
   */
  static async searchReferrals(query: string, params?: Omit<ReferralListParams, 'search'>): Promise<ReferralListResponse> {
    return this.getReferrals({
      ...params,
      search: query,
    });
  }

  /**
   * Get referrals by status
   */
  static async getReferralsByStatus(statusId: number, params?: Omit<ReferralListParams, 'status_id'>): Promise<ReferralListResponse> {
    return this.getReferrals({
      ...params,
      status_id: statusId,
    });
  }

  /**
   * Get referrals by priority
   */
  static async getReferralsByPriority(priorityId: number, params?: Omit<ReferralListParams, 'priority_id'>): Promise<ReferralListResponse> {
    return this.getReferrals({
      ...params,
      priority_id: priorityId,
    });
  }

  /**
   * Get referrals by client type
   */
  static async getReferralsByClientType(clientType: string, params?: Omit<ReferralListParams, 'client_type'>): Promise<ReferralListResponse> {
    return this.getReferrals({
      ...params,
      client_type: clientType,
    });
  }
}