export interface CachedItem<T = unknown> {
  data: T;
  timestamp: number;
}

/**
 * Get cached item from localStorage
 * @param id - Item ID
 * @param cachePrefix - Cache key prefix
 * @param cacheExpiration - Cache expiration time in milliseconds
 * @returns Cached item or null if not found/expired
 */
export const getCachedItem = <T = unknown>(
  id: string,
  cachePrefix: string,
  cacheExpiration?: number,
): T | null => {
  try {
    const key = `${cachePrefix}_${id}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp }: CachedItem<T> = JSON.parse(cached);

    if (cacheExpiration && Date.now() - timestamp > cacheExpiration) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

/**
 * Set cached item in localStorage
 * @param id - Item ID
 * @param item - Item to cache
 * @param cachePrefix - Cache key prefix
 */
export const setCachedItem = <T = unknown>(
  id: string,
  item: T,
  cachePrefix: string,
): void => {
  try {
    const key = `${cachePrefix}_${id}`;
    const cacheData: CachedItem<T> = {
      data: item,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (err) {
    console.warn("Failed to cache dismissible item:", err);
  }
};

/**
 * Remove cached item from localStorage
 * @param id - Item ID
 * @param cachePrefix - Cache key prefix
 */
export const removeCachedItem = (id: string, cachePrefix: string): void => {
  try {
    const key = `${cachePrefix}_${id}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("Failed to remove cached dismissible item:", err);
  }
};
