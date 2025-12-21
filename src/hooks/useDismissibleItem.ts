import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import createFetchClient from "openapi-fetch";
import { components, paths } from "../generated/contract";
import {
  getCachedItem,
  setCachedItem,
  removeCachedItem,
} from "../utils/localStorage";
import { useDismissibleContext } from "../contexts/DismissibleContext";

type DismissibleItem = components["schemas"]["DismissibleItemResponseDto"];

export type IDismissibleItem = DismissibleItem;

export interface UseDismissibleItemOptions {
  /** Initial data for the dismissible item */
  initialData?: IDismissibleItem;
  /** Enable localStorage caching (default: true) */
  enableCache?: boolean;
  /** Cache key prefix (default: 'dismissible') */
  cachePrefix?: string;
  /** Cache expiration time in milliseconds (default: never expires) */
  cacheExpiration?: number;
}

const DEFAULT_CACHE_PREFIX = "dismissible";

/**
 * Hook for managing dismissible items
 * @param id - The ID of the dismissible item
 * @param options - Configuration options for the hook
 * @returns Object with dismissedOn, dismiss and restore functions
 */
export const useDismissibleItem = (
  itemId: string,
  options: UseDismissibleItemOptions = {},
) => {
  const {
    initialData,
    enableCache = true,
    cachePrefix = DEFAULT_CACHE_PREFIX,
    cacheExpiration,
  } = options;

  // Get context for authentication and userId (throws if not within provider)
  const context = useDismissibleContext();
  const { userId } = context;

  // Create authenticated fetch client using context
  const fetchClient = useMemo(() => {
    return createFetchClient<paths>({
      baseUrl: context.baseUrl,
      headers: {},
    });
  }, [context.baseUrl]);

  // Generate user-aware cache key to prevent conflicts between users
  const userCacheKey = useMemo(() => {
    return `${userId}-${itemId}`;
  }, [userId, itemId]);

  // Track previous values to detect changes without suppressing exhaustive-deps
  const previousCacheSettings = useRef<{
    enableCache: boolean;
    cachePrefix: string;
    cacheExpiration?: number;
  }>({
    enableCache,
    cachePrefix,
    cacheExpiration,
  });
  const previousId = useRef(itemId);
  const previousUserCacheKey = useRef(userCacheKey);

  // AbortController ref to cancel pending requests on unmount or when dependencies change
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for cached data on initialization
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [item, setItem] = useState<IDismissibleItem | undefined>(() => {
    if (initialData) return initialData;
    if (enableCache) {
      const cached = getCachedItem<IDismissibleItem>(
        userCacheKey,
        cachePrefix,
        cacheExpiration,
      );
      if (cached) return cached;
    }
    return undefined;
  });

  // Fetch the dismissible item data
  const fetchItem = useCallback(async () => {
    // Check cache first if enabled
    if (enableCache) {
      const cachedItem = getCachedItem<IDismissibleItem>(
        userCacheKey,
        cachePrefix,
        cacheExpiration,
      );
      if (cachedItem?.dismissedAt) {
        setItem(cachedItem);
        setIsLoading(false);
        return;
      }
    }

    // Cancel any pending request before starting a new one
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      // Get authentication headers dynamically (supports async JWT functions)
      const authHeaders = await context.getAuthHeaders();

      const { data, error } = await fetchClient.GET(
        "/v1/users/{userId}/items/{itemId}",
        {
          params: {
            path: {
              userId,
              itemId: itemId,
            },
          },
          headers: authHeaders,
          signal: abortController.signal,
        },
      );

      if (error || !data) {
        throw new Error("Failed to fetch dismissible item");
      }

      setItem(data.data);

      // Cache the fetched item if caching is enabled
      if (enableCache) {
        setCachedItem(userCacheKey, data.data, cachePrefix);
      }
    } catch (err) {
      // Ignore abort errors - they're expected when cancelling requests
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    itemId,
    userId,
    userCacheKey,
    enableCache,
    cachePrefix,
    cacheExpiration,
    fetchClient,
    context,
  ]);

  // Load data on mount and when id/user changes.
  // Behavior goals:
  // - If initialData is provided, do NOT fetch on first mount.
  // - If id/user changes, always fetch (even if initialData is present) to avoid stale data.
  useEffect(() => {
    const idChanged = previousId.current !== itemId;
    const userCacheKeyChanged = previousUserCacheKey.current !== userCacheKey;

    if (idChanged || userCacheKeyChanged) {
      // ID or user changed, always fetch regardless of cache
      previousId.current = itemId;
      previousUserCacheKey.current = userCacheKey;
      fetchItem();
    } else {
      const hasInitialData = !!initialData;
      if (!hasInitialData) {
        fetchItem();
      }
    }
  }, [itemId, userCacheKey, initialData, fetchItem]);

  // Cleanup: abort any pending requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Handle cache settings changes
  useEffect(() => {
    const prev = previousCacheSettings.current;
    const hasSettingsChanged =
      prev.enableCache !== enableCache ||
      prev.cachePrefix !== cachePrefix ||
      prev.cacheExpiration !== cacheExpiration;

    if (hasSettingsChanged) {
      // Clean up old cache entry if cachePrefix changed
      if (prev.cachePrefix !== cachePrefix) {
        removeCachedItem(userCacheKey, prev.cachePrefix);
      }

      // If cache is now disabled, remove current cache entry
      if (!enableCache && prev.enableCache) {
        // Remove using the previous prefix (that is where the entry was stored).
        removeCachedItem(userCacheKey, prev.cachePrefix);
      }

      // Update the ref with current settings
      previousCacheSettings.current = {
        enableCache,
        cachePrefix,
        cacheExpiration,
      };

      // Refetch to ensure data consistency with new settings
      fetchItem();
    }
  }, [enableCache, cachePrefix, cacheExpiration, userCacheKey, fetchItem]);

  // Dismiss the item
  const dismiss = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const authHeaders = await context.getAuthHeaders();

      const { data, error } = await fetchClient.DELETE(
        "/v1/users/{userId}/items/{itemId}",
        {
          params: {
            path: {
              userId,
              itemId: itemId,
            },
          },
          headers: authHeaders,
        },
      );

      if (error || !data) {
        throw new Error("Failed to dismiss item");
      }

      setItem(data.data);

      // Update cache with dismissed item if caching is enabled
      if (enableCache) {
        setCachedItem(userCacheKey, data.data, cachePrefix);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to dismiss item"),
      );
      throw err;
    }
  }, [
    itemId,
    userId,
    userCacheKey,
    enableCache,
    cachePrefix,
    fetchClient,
    context,
  ]);

  // Restore the item
  const restore = useCallback(async (): Promise<void> => {
    setError(null);

    try {
      const authHeaders = await context.getAuthHeaders();

      const { data, error } = await fetchClient.POST(
        "/v1/users/{userId}/items/{itemId}",
        {
          params: {
            path: {
              userId,
              itemId: itemId,
            },
          },
          headers: authHeaders,
        },
      );

      if (error || !data) {
        throw new Error("Failed to restore item");
      }

      setItem(data.data);

      // Update cache with restored item if caching is enabled
      if (enableCache) {
        setCachedItem(userCacheKey, data.data, cachePrefix);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to restore item"),
      );
      throw err;
    }
  }, [
    itemId,
    userId,
    userCacheKey,
    enableCache,
    cachePrefix,
    fetchClient,
    context,
  ]);

  return {
    dismissedOn: item?.dismissedAt ?? null,
    dismiss,
    restore,
    isLoading,
    error,
    item,
  };
};
