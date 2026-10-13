/**
 * Production API configuration for Cardiac Risk Navigator.
 * Dynamically resolves the backend API URL from NEXT_PUBLIC_API_URL,
 * defaulting to http://localhost:8000 for local development.
 */

export const API_BASE_URL: string =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
    : "http://localhost:8000");

/**
 * Returns a fully qualified URL for a given API endpoint.
 *
 * @param endpoint The path of the endpoint (e.g. "/predict" or "auth/login")
 * @returns Fully qualified API URL
 */
export function getApiUrl(endpoint: string): string {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
}
