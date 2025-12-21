export interface ApiConfig {
  /** Base URL for API requests */
  baseUrl: string;
}

const defaultConfig: ApiConfig = {
  baseUrl: "https://api.dismissible.io",
};

export const getConfig = (): ApiConfig => {
  return defaultConfig;
};

export const getBaseUrl = (): string => {
  return getConfig().baseUrl;
};

export default getConfig;
