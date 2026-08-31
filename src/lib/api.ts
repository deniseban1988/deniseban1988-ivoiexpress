/**
 * Central API configuration for the IVOIReXpress platform.
 * Points to the production backend by default.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '';

/**
 * Utility to build full API URLs.
 * Ensures relative paths are prepended with the base URL if configured.
 */
export function getApiUrl(path: string): string {
  if (!API_BASE_URL) return path;
  
  // If the path is already a full URL, return it
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
