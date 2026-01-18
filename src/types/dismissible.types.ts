/**
 * TypeScript types for the Dismissible Provider system
 */

/**
 * JWT token can be either a static string, a function that returns a string, or an async function that returns a string
 */
export type JwtToken = string | (() => string) | (() => Promise<string>);

/**
 * Authentication headers type
 */
export interface AuthHeaders {
  Authorization?: string;
  [key: string]: string | undefined;
}

/**
 * Dismissible item data returned from the API
 */
export interface DismissibleItem {
  /** Unique identifier for the item */
  itemId: string;
  /** User identifier who created the item */
  userId: string;
  /** When the item was created (ISO 8601) */
  createdAt: string;
  /** When the item was dismissed (ISO 8601), undefined if not dismissed */
  dismissedAt?: string;
}

// ============================================================================
// Client Interface Types
// ============================================================================

/**
 * Base parameters shared by all client methods
 */
export interface BaseDismissibleClientParams {
  /** User ID for the current user */
  userId: string;
  /** The dismissible item ID */
  itemId: string;
  /** Base URL for API requests */
  baseUrl: string;
  /** Authentication headers */
  authHeaders: AuthHeaders;
}

/**
 * Parameters for the getOrCreate client method
 */
export interface GetOrCreateClientParams extends BaseDismissibleClientParams {
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Parameters for the dismiss client method
 */
export type DismissClientParams = BaseDismissibleClientParams;

/**
 * Parameters for the restore client method
 */
export type RestoreClientParams = BaseDismissibleClientParams;

/**
 * Parameters for the batchGetOrCreate client method
 */
export interface BatchGetOrCreateClientParams {
  /** User ID for the current user */
  userId: string;
  /** Array of dismissible item IDs to fetch (max 50) */
  itemIds: string[];
  /** Base URL for API requests */
  baseUrl: string;
  /** Authentication headers */
  authHeaders: AuthHeaders;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Interface for custom HTTP clients
 *
 * Users can implement this interface to provide their own HTTP client
 * with custom headers, tracking, interceptors, etc.
 *
 * @example
 * ```typescript
 * const myClient: DismissibleClient = {
 *   getOrCreate: async ({ userId, itemId, baseUrl, authHeaders, signal }) => {
 *     const res = await axios.get(`${baseUrl}/v1/users/${userId}/items/${itemId}`, {
 *       headers: { ...authHeaders, 'X-Correlation-ID': uuid() },
 *       signal
 *     });
 *     return res.data.data;
 *   },
 *   dismiss: async ({ userId, itemId, baseUrl, authHeaders }) => { ... },
 *   restore: async ({ userId, itemId, baseUrl, authHeaders }) => { ... },
 * };
 * ```
 */
export interface DismissibleClient {
  /** Get or create a dismissible item */
  getOrCreate: (params: GetOrCreateClientParams) => Promise<DismissibleItem>;
  /** Batch get or create multiple dismissible items (max 50) */
  batchGetOrCreate: (
    params: BatchGetOrCreateClientParams,
  ) => Promise<DismissibleItem[]>;
  /** Dismiss an item */
  dismiss: (params: DismissClientParams) => Promise<DismissibleItem>;
  /** Restore a dismissed item */
  restore: (params: RestoreClientParams) => Promise<DismissibleItem>;
}

// ============================================================================
// Provider & Context Types
// ============================================================================

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
  /** Custom HTTP client implementation (optional - uses default if not provided) */
  client?: DismissibleClient;
  /** Child components */
  children: React.ReactNode;
}

/**
 * Batch scheduler interface for request coalescing
 */
export interface IBatchScheduler {
  /** Request a dismissible item (batched with other requests in same tick) */
  getItem: (itemId: string) => Promise<DismissibleItem>;
  /** Pre-populate cache with an item */
  primeCache: (item: DismissibleItem) => void;
  /** Update an item in the cache */
  updateCache: (item: DismissibleItem) => void;
  /** Clear the in-memory cache */
  clearCache: () => void;
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
  /** The HTTP client to use for API requests */
  client: DismissibleClient;
  /** Batch scheduler for coalescing getOrCreate requests */
  batchScheduler: IBatchScheduler;
}
