import createFetchClient from "openapi-fetch";
import { paths } from "../generated/contract";
import {
  DismissibleClient,
  DismissibleItem,
  GetOrCreateClientParams,
  DismissClientParams,
  RestoreClientParams,
} from "../types/dismissible.types";

/**
 * Creates the default HTTP client using openapi-fetch
 *
 * @param baseUrl - The base URL for the API
 * @returns A DismissibleClient implementation
 *
 * @example
 * ```typescript
 * // Use the default client directly
 * const client = createDefaultClient("https://api.dismissible.io");
 *
 * // Or wrap it with custom behavior
 * const customClient: DismissibleClient = {
 *   getOrCreate: async (params) => {
 *     console.log("Fetching item:", params.itemId);
 *     const defaultClient = createDefaultClient(params.baseUrl);
 *     return defaultClient.getOrCreate(params);
 *   },
 *   dismiss: async (params) => { ... },
 *   restore: async (params) => { ... },
 * };
 * ```
 */
export const createDefaultClient = (baseUrl: string): DismissibleClient => {
  const fetchClient = createFetchClient<paths>({
    baseUrl,
    headers: {},
  });

  return {
    getOrCreate: async (
      params: GetOrCreateClientParams,
    ): Promise<DismissibleItem> => {
      const { userId, itemId, authHeaders, signal } = params;

      const { data, error } = await fetchClient.GET(
        "/v1/users/{userId}/items/{itemId}",
        {
          params: {
            path: {
              userId,
              itemId,
            },
          },
          headers: authHeaders,
          signal,
        },
      );

      if (error || !data) {
        throw new Error("Failed to fetch dismissible item");
      }

      return data.data;
    },

    dismiss: async (params: DismissClientParams): Promise<DismissibleItem> => {
      const { userId, itemId, authHeaders } = params;

      const { data, error } = await fetchClient.DELETE(
        "/v1/users/{userId}/items/{itemId}",
        {
          params: {
            path: {
              userId,
              itemId,
            },
          },
          headers: authHeaders,
        },
      );

      if (error || !data) {
        throw new Error("Failed to dismiss item");
      }

      return data.data;
    },

    restore: async (params: RestoreClientParams): Promise<DismissibleItem> => {
      const { userId, itemId, authHeaders } = params;

      const { data, error } = await fetchClient.POST(
        "/v1/users/{userId}/items/{itemId}",
        {
          params: {
            path: {
              userId,
              itemId,
            },
          },
          headers: authHeaders,
        },
      );

      if (error || !data) {
        throw new Error("Failed to restore item");
      }

      return data.data;
    },
  };
};
