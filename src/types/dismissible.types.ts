/**
 * TypeScript types for the Dismissible Provider system
 */

/**
 * JWT token can be either a static string, a function that returns a string, or an async function that returns a string
 */
export type JwtToken = string | (() => string) | (() => Promise<string>);

/**
 * Configuration options for the DismissibleProvider
 */
export interface DismissibleProviderProps {
  /** User ID for the current user - required for all API calls */
  userId: string;
  /** JWT token for authentication - can be static string or function */
  jwt?: JwtToken;
  /** Base URL for API requests */
  baseUrl: string;
  /** Child components */
  children: React.ReactNode;
}

/**
 * Context value provided by DismissibleProvider
 */
export interface DismissibleContextValue {
  /** User ID for the current user - required for all API calls */
  userId: string;
  /** JWT token for authentication */
  jwt?: JwtToken;
  /** Base URL for API requests */
  baseUrl: string;
  /** Helper function to get authentication headers */
  getAuthHeaders: () => Promise<AuthHeaders>;
}

/**
 * Authentication headers type
 */
export interface AuthHeaders {
  Authorization?: string;
  [key: string]: string | undefined;
}
