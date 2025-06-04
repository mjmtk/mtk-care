import { getSession } from "next-auth/react";

const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000/api"; // Adjust if your Django API runs elsewhere or has a different base

// Extend RequestInit directly since we don't have custom options yet
type ApiClientOptions = RequestInit;

async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const session = await getSession();
  const headers = new Headers(options.headers || {});

  if (session?.accessToken) {
    headers.append("Authorization", `Bearer ${session.accessToken}`);
  }

  // Add other default headers if needed, e.g., Content-Type
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.append("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // You might want to handle errors more gracefully
    // e.g., by parsing error responses from the backend
    const errorData = await response.text(); // or response.json() if your backend sends structured errors
    console.error("API Error:", response.status, errorData);
    throw new Error(`API request failed with status ${response.status}: ${errorData}`);
  }

  // Handle cases where the response might be empty (e.g., for 204 No Content)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  // For non-JSON responses or empty responses, you might return null or the response object itself
  // For simplicity here, assuming JSON or throwing if not.
  // Adjust as per your API's behavior.
  if (response.status === 204) {
    return null as T; // Or appropriate type for no content
  }
  // If you expect non-JSON responses, handle them here
  // For now, let's assume an error if it's not JSON and not 204
  throw new Error("Received non-JSON response from API");
}

export default apiClient;
