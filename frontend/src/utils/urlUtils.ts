/**
 * Utility for handling API and static asset URLs
 */

/**
 * Gets the root API URL (no trailing slash, no /api suffix).
 */
export const getApiRootUrl = (): string => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const root = url.endsWith('/') ? url.slice(0, -1) : url;
  return root.replace(/\/api$/, '');
};

/**
 * Gets the base API URL (with /api suffix).
 */
export const getApiBaseUrl = (): string => {
  return `${getApiRootUrl()}/api`;
};

/**
 * Prepends the base API URL to a relative asset path (avatar, document, etc.)
 * Returns the path as-is if it already starts with http/https.
 * 
 * @param path The relative or absolute path to the asset
 * @returns The full URL to the asset
 */
export const getFullImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const baseUrl = getApiBaseUrl();
  // Ensure the relative path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Special case: if baseUrl ends with /api, we might need the root for uploads
  // depending on how the backend serves files. Usually, /uploads is at the root.
  const rootUrl = baseUrl.replace(/\/api$/, '');
  
  return `${rootUrl}${normalizedPath}`;
};
