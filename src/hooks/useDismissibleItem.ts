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

  const context = useDismissibleContext();
  const { userId } = context;

  const fetchClient = useMemo(() => {
    return createFetchClient<paths>({
      baseUrl: context.baseUrl,
      headers: {},
    });
  }, [context.baseUrl]);

  const userCacheKey = useMemo(() => {
    return `${userId}-${itemId}`;
  }, [userId, itemId]);

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

  const fetchItem = useCallback(async () => {
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

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
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

      if (enableCache) {
        setCachedItem(userCacheKey, data.data, cachePrefix);
      }
    } catch (err) {
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
