import { apiRequest } from './api-request';

/**
 * Create a service enrolment.
 * Relies on an established Django session.
 * @param params - Enrolment fields (see backend API docs)
 * @returns The created enrolment object (must include 'id')
 */
export async function createServiceEnrolment(params: {
  client: string;
  service_program: string;
  responsible_staff: string;
  start_date: string;
  status?: string;
}): Promise<any> { // Consider defining a specific return type e.g., ServiceEnrolment
  const url = 'service-enrolments/';
  const payload = { ...params, status: params.status || 'active' };
  try {
    const data = await apiRequest<any>({ url, method: 'post', data: payload });
    if (!data || !data.id) {
      console.error('Service enrolment creation response missing id:', data);
      throw new Error('Service enrolment creation failed: missing id in response');
    }
    return data;
  } catch (error: any) {
    console.error("Error creating service enrolment:", error.response ? error.response.data : error.message);
    throw error; // Re-throw the Axios error object for the caller to handle
  }
}
