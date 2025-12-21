/**
 * API configuration settings
 */

/**
 * Configuration interface for API settings
 */
export interface ApiConfig {
  /** Base URL for API requests */
  baseUrl: string;
}

/**
 * Default configuration values.
 *
 * Note: This is a published library. Avoid environment-specific runtime detection
 * (e.g. `import.meta.env`) because consumers may bundle this in environments where
 * those globals are not available. Consumers should override via
 * `DismissibleProvider baseUrl` when needed.
 */
const defaultConfig: ApiConfig = {
  baseUrl: "https://api.dismissible.io",
};

/**
 * Returns the API configuration based on the current environment
 * @returns The API configuration object
 */
export const getConfig = (): ApiConfig => {
  return defaultConfig;
};

/**
 * Gets the API base URL
 * @returns The base URL for API requests
 */
export const getBaseUrl = (): string => {
  return getConfig().baseUrl;
};

export default getConfig;
