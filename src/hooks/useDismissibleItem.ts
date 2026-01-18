import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCachedItem,
  setCachedItem,
  removeCachedItem,
} from "../utils/localStorage";
import { useDismissibleContext } from "../contexts/DismissibleContext";
import { DismissibleItem } from "../types/dismissible.types";

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

export interface UseDismissibleItemResponse {
  /** The date when the item was dismissed, or undefined if not dismissed */
  dismissedAt?: IDismissibleItem["dismissedAt"];
  /** Function to dismiss the item */
  dismiss: () => Promise<void>;
  /** Function to restore the item */
  restore: () => Promise<void>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: Error;
  /** The dismissible item data */
  item?: IDismissibleItem;
}

const DEFAULT_CACHE_PREFIX = "dismissible";

/**
 * Hook for managing dismissible items
 * @param id - The ID of the dismissible item
 * @param options - Configuration options for the hook
 * @returns Object with dismissedAt, dismiss and restore functions
 */
export const useDismissibleItem = (
  itemId: string,
  options: UseDismissibleItemOptions = {},
): UseDismissibleItemResponse => {
  const {
    initialData,
    enableCache = true,
    cachePrefix = DEFAULT_CACHE_PREFIX,
    cacheExpiration,
  } = options;

  const { userId, client, baseUrl, getAuthHeaders, batchScheduler } =
    useDismissibleContext();

  const userCacheKey = `${userId}-${itemId}`;

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

  const abortControllerRef = useRef<AbortController | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>();
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

  const fetchItem = useCallback(async () => {
    if (enableCache) {
      const cachedItem = getCachedItem<IDismissibleItem>(
        userCacheKey,
        cachePrefix,
        cacheExpiration,
      );
      if (cachedItem?.dismissedAt) {
        // Prime the batch scheduler cache with dismissed items from localStorage
        batchScheduler.primeCache(cachedItem);
        setItem(cachedItem);
        setIsLoading(false);
        return;
      }
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(undefined);

    try {
      // Use batch scheduler for coalesced fetching
      const data = await batchScheduler.getItem(itemId);

      // Check if request was aborted before updating state
      if (abortController.signal.aborted) {
        return;
      }

      setItem(data);

      if (enableCache) {
        setCachedItem(userCacheKey, data, cachePrefix);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      if (abortController.signal.aborted) {
        return;
      }
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred"),
      );
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [
    itemId,
    userCacheKey,
    enableCache,
    cachePrefix,
    cacheExpiration,
    batchScheduler,
  ]);

  useEffect(() => {
    const idChanged = previousId.current !== itemId;
    const userCacheKeyChanged = previousUserCacheKey.current !== userCacheKey;

    if (idChanged || userCacheKeyChanged) {
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

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const prev = previousCacheSettings.current;
    const hasSettingsChanged =
      prev.enableCache !== enableCache ||
      prev.cachePrefix !== cachePrefix ||
      prev.cacheExpiration !== cacheExpiration;

    if (hasSettingsChanged) {
      if (prev.cachePrefix !== cachePrefix) {
        removeCachedItem(userCacheKey, prev.cachePrefix);
      }

      if (!enableCache && prev.enableCache) {
        removeCachedItem(userCacheKey, prev.cachePrefix);
      }

      previousCacheSettings.current = {
        enableCache,
        cachePrefix,
        cacheExpiration,
      };

      fetchItem();
    }
  }, [enableCache, cachePrefix, cacheExpiration, userCacheKey, fetchItem]);

  const dismiss = useCallback(async (): Promise<void> => {
    setError(undefined);

    try {
      const authHeaders = await getAuthHeaders();

      const data = await client.dismiss({
        userId,
        itemId,
        baseUrl,
        authHeaders,
      });

      setItem(data);

      // Update batch scheduler cache so subsequent reads get dismissed state
      batchScheduler.updateCache(data);

      if (enableCache) {
        setCachedItem(userCacheKey, data, cachePrefix);
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
    client,
    baseUrl,
    getAuthHeaders,
    batchScheduler,
  ]);

  const restore = useCallback(async (): Promise<void> => {
    setError(undefined);

    try {
      const authHeaders = await getAuthHeaders();

      const data = await client.restore({
        userId,
        itemId,
        baseUrl,
        authHeaders,
      });

      setItem(data);

      // Update batch scheduler cache so subsequent reads get restored state
      batchScheduler.updateCache(data);

      if (enableCache) {
        setCachedItem(userCacheKey, data, cachePrefix);
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
    client,
    baseUrl,
    getAuthHeaders,
    batchScheduler,
  ]);

  return {
    dismissedAt: item?.dismissedAt,
    dismiss,
    restore,
    isLoading,
    error,
    item,
  };
};
