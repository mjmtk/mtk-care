// Shared utilities for API services

/**
 * Returns the API base URL from environment variables, with fallback for dev.
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:8000/api';
}

/**
 * Builds a query string from an object of parameters, omitting undefined/null values.
 */
export function buildQueryString(params: Record<string, any>): string {
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '') // Also filter out empty strings
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query; // Return the raw query string or an empty string
}

/**
 * Parses error responses according to API conventions.
 */
export async function parseApiError(response: Response): Promise<{ detail: string }> {
  try {
    const data = await response.json();
    return { detail: data.detail || response.statusText };
  } catch {
    return { detail: response.statusText };
  }
}
