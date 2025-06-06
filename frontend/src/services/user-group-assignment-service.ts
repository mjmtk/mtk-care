import axiosInstance from './axios-client';

export interface UserGroupAssignment {
  user_id: number;
  groups: number[];
}

export interface UserGroupAssignmentResult {
  user_id: number;
  groups: number[];
  roles: string[];
  status: string;
}

export interface BulkAssignmentResponse {
  results: UserGroupAssignmentResult[];
}

export class UserGroupAssignmentService {
  /**
   * Bulk assign groups to a user (or users, if backend supports multiple assignments in the array).
   * Relies on an established Django session.
   * @param assignment A single assignment object {user_id, groups}.
   *                   The backend expects an 'assignments' array; this method wraps the single assignment.
   */
  static async bulkAssign(
    assignment: UserGroupAssignment
  ): Promise<BulkAssignmentResponse> {
    const url = '/user-group-assignments/bulk/';
    const payload = { assignments: [assignment] }; // Backend expects an array
    try {
      const response = await axiosInstance.post<BulkAssignmentResponse>(url, payload);
      return response.data;
    } catch (error: any) {
      console.error("Error in bulk assigning user groups:", error.response ? error.response.data : error.message);
      throw error;
    }
  }
}
