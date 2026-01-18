import React, { useMemo, useEffect } from "react";
import { DismissibleContext } from "./DismissibleContext";
import {
  DismissibleProviderProps,
  DismissibleContextValue,
} from "../types/dismissible.types";
import { getAuthHeaders } from "../utils/auth.utils";
import { createDefaultClient } from "../clients/defaultClient";
import { checkUrlSecurity } from "../utils/url.utils";
import { BatchScheduler } from "../utils/BatchScheduler";

/**
 * Provider component for managing dismissible authentication state
 *
 * @example
 * ```tsx
 * // With static JWT
 * <DismissibleProvider userId="user-123" jwt="eyJhbGciOiJ..." baseUrl="https://api.dismissible.io">
 *   <App />
 * </DismissibleProvider>
 *
 * // With synchronous JWT function
 * <DismissibleProvider
 *   userId="user-123"
 *   jwt={() => getAccessToken()}
 *   baseUrl="https://api.dismissible.io"
 * >
 *   <App />
 * </DismissibleProvider>
 *
 * // With asynchronous JWT function
 * <DismissibleProvider
 *   userId="user-123"
 *   jwt={async () => await fetchAccessToken()}
 *   baseUrl="https://api.dismissible.io"
 * >
 *   <App />
 * </DismissibleProvider>
 *
 * // With custom HTTP client
 * const myClient: DismissibleClient = {
 *   getOrCreate: async ({ resolvedPath, baseUrl, authHeaders, signal }) => {
 *     const res = await axios.get(`${baseUrl}${resolvedPath}`, {
 *       headers: { ...authHeaders, 'X-Correlation-ID': uuid() },
 *       signal
 *     });
 *     return res.data.data;
 *   },
 *   dismiss: async (params) => { ... },
 *   restore: async (params) => { ... },
 * };
 *
 * <DismissibleProvider
 *   userId="user-123"
 *   jwt={token}
 *   baseUrl="https://api.dismissible.io"
 *   client={myClient}
 * >
 *   <App />
 * </DismissibleProvider>
 * ```
 */
export const DismissibleProvider: React.FC<DismissibleProviderProps> = ({
  userId,
  jwt,
  baseUrl,
  client,
  children,
}) => {
  // Warn about insecure baseUrl only when it changes
  useEffect(() => {
    const { isSecure } = checkUrlSecurity(baseUrl);
    if (!isSecure) {
      console.warn(
        `[dismissible] Insecure baseUrl "${baseUrl}". ` +
          `Use https:// in production (or localhost for development). ` +
          `JWT tokens may be exposed over insecure connections.`,
      );
    }
  }, [baseUrl]);

  const resolvedClient = useMemo(
    () => client ?? createDefaultClient(baseUrl),
    [client, baseUrl],
  );

  const getAuthHeadersFn = useMemo(
    () => async () => await getAuthHeaders(jwt),
    [jwt],
  );

  // Create BatchScheduler using useMemo to avoid recreating on every render
  // It will be recreated when userId, baseUrl, or client changes
  const batchScheduler = useMemo(
    () =>
      new BatchScheduler({
        userId,
        baseUrl,
        client: resolvedClient,
        getAuthHeaders: getAuthHeadersFn,
      }),
    [userId, baseUrl, resolvedClient, getAuthHeadersFn],
  );

  const contextValue: DismissibleContextValue = useMemo(
    () => ({
      userId,
      jwt,
      baseUrl,
      getAuthHeaders: getAuthHeadersFn,
      client: resolvedClient,
      batchScheduler,
    }),
    [userId, jwt, baseUrl, getAuthHeadersFn, resolvedClient, batchScheduler],
  );

  return (
    <DismissibleContext.Provider value={contextValue}>
      {children}
    </DismissibleContext.Provider>
  );
};
