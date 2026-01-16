/**
 * Checks if a URL uses secure transport (https or localhost)
 * @returns Object with isSecure flag and parsed URL info
 */
export const checkUrlSecurity = (
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
