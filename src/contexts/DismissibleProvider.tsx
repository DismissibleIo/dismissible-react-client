import React, { useMemo } from "react";
import { DismissibleContext } from "./DismissibleContext";
import {
  DismissibleProviderProps,
  DismissibleContextValue,
} from "../types/dismissible.types";
import { getAuthHeaders } from "../utils/auth.utils";

/**
 * Checks if a URL uses secure transport (https or localhost)
 * @returns Object with isSecure flag and parsed URL info
 */
const checkUrlSecurity = (
  url: string,
): { isSecure: boolean; isLocalhost: boolean; isHttps: boolean } => {
  try {
    const parsed = new URL(url);
    const isLocalhost =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]";
    const isHttps = parsed.protocol === "https:";
    return { isSecure: isHttps || isLocalhost, isLocalhost, isHttps };
  } catch {
    return { isSecure: false, isLocalhost: false, isHttps: false };
  }
};

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
 * ```
 */
export const DismissibleProvider: React.FC<DismissibleProviderProps> = ({
  userId,
  jwt,
  baseUrl,
  children,
}) => {
  const { isSecure } = checkUrlSecurity(baseUrl);
  if (!isSecure) {
    console.warn(
      `[dismissible] Insecure baseUrl "${baseUrl}". ` +
        `Use https:// in production (or localhost for development). ` +
        `JWT tokens may be exposed over insecure connections.`,
    );
  }

  const contextValue: DismissibleContextValue = useMemo(
    () => ({
      userId,
      jwt,
      baseUrl,
      getAuthHeaders: async () => await getAuthHeaders(jwt),
    }),
    [userId, jwt, baseUrl],
  );

  return (
    <DismissibleContext.Provider value={contextValue}>
      {children}
    </DismissibleContext.Provider>
  );
};
