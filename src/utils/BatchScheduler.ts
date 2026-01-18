import {
  DismissibleClient,
  DismissibleItem,
  AuthHeaders,
} from "../types/dismissible.types";

/**
 * Pending request in the batch queue
 */
interface PendingRequest {
  itemId: string;
  resolve: (item: DismissibleItem) => void;
  reject: (error: Error) => void;
}

/**
 * Configuration for the BatchScheduler
 */
export interface BatchSchedulerConfig {
  /** User ID for API requests */
  userId: string;
  /** Base URL for API requests */
  baseUrl: string;
  /** The HTTP client to use */
  client: DismissibleClient;
  /** Function to get auth headers */
  getAuthHeaders: () => Promise<AuthHeaders>;
  /** Maximum items per batch (API limit is 50) */
  maxBatchSize?: number;
}

/**
 * BatchScheduler implements DataLoader-style request batching.
 *
 * When multiple components request items in the same JavaScript tick,
 * the scheduler coalesces them into a single batch API call using
 * queueMicrotask to defer execution until after synchronous code completes.
 *
 * @example
 * ```typescript
 * const scheduler = new BatchScheduler({
 *   userId: "user-123",
 *   baseUrl: "https://api.example.com",
 *   client: dismissibleClient,
 *   getAuthHeaders: async () => ({ Authorization: "Bearer ..." }),
 * });
 *
 * // These three calls in the same tick will be batched into one API call
 * const [item1, item2, item3] = await Promise.all([
 *   scheduler.getItem("item-1"),
 *   scheduler.getItem("item-2"),
 *   scheduler.getItem("item-3"),
 * ]);
 * ```
 */
export class BatchScheduler {
  private config: BatchSchedulerConfig;
  private pendingRequests: PendingRequest[] = [];
  private isScheduled = false;
  private cache = new Map<string, DismissibleItem>();
  private inFlightRequests = new Map<string, Promise<DismissibleItem>>();

  constructor(config: BatchSchedulerConfig) {
    this.config = {
      ...config,
      maxBatchSize: config.maxBatchSize ?? 50,
    };
  }

  /**
   * Request a dismissible item. If called multiple times in the same
   * JavaScript tick, requests will be batched into a single API call.
   *
   * @param itemId - The item ID to fetch
   * @returns Promise resolving to the DismissibleItem
   */
  getItem(itemId: string): Promise<DismissibleItem> {
    // Check in-memory cache first
    const cached = this.cache.get(itemId);
    if (cached) {
      return Promise.resolve(cached);
    }

    // Check if there's already an in-flight request for this item
    const inFlight = this.inFlightRequests.get(itemId);
    if (inFlight) {
      return inFlight;
    }

    // Create a new pending request
    let resolveRequest: (item: DismissibleItem) => void;
    let rejectRequest: (error: Error) => void;

    const promise = new Promise<DismissibleItem>((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });

    this.pendingRequests.push({
      itemId,
      resolve: resolveRequest!,
      reject: rejectRequest!,
    });

    // Track this as in-flight to dedupe concurrent requests for same item
    this.inFlightRequests.set(itemId, promise);

    // Clean up in-flight tracking when done
    // The catch here prevents unhandled rejection warnings in test environments
    // while still allowing the caller to catch the error
    promise
      .catch(() => {
        // Error will be handled by the caller
      })
      .finally(() => {
        this.inFlightRequests.delete(itemId);
      });

    // Schedule batch execution if not already scheduled
    if (!this.isScheduled) {
      this.isScheduled = true;
      queueMicrotask(() => this.executeBatch());
    }

    return promise;
  }

  /**
   * Pre-populate the cache with items (e.g., from localStorage)
   */
  primeCache(item: DismissibleItem): void {
    this.cache.set(item.itemId, item);
  }

  /**
   * Update an item in the cache (e.g., after dismiss/restore)
   */
  updateCache(item: DismissibleItem): void {
    this.cache.set(item.itemId, item);
  }

  /**
   * Clear the in-memory cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Execute the batched requests
   */
  private async executeBatch(): Promise<void> {
    // Reset scheduled flag and capture pending requests
    this.isScheduled = false;
    const requests = this.pendingRequests;
    this.pendingRequests = [];

    if (requests.length === 0) {
      return;
    }

    // Dedupe item IDs while preserving request references
    const itemIdToRequests = new Map<string, PendingRequest[]>();
    for (const request of requests) {
      const existing = itemIdToRequests.get(request.itemId);
      if (existing) {
        existing.push(request);
      } else {
        itemIdToRequests.set(request.itemId, [request]);
      }
    }

    const uniqueItemIds = Array.from(itemIdToRequests.keys());

    // Split into batches if needed (respecting API limit)
    const batches: string[][] = [];
    for (let i = 0; i < uniqueItemIds.length; i += this.config.maxBatchSize!) {
      batches.push(uniqueItemIds.slice(i, i + this.config.maxBatchSize!));
    }

    try {
      const authHeaders = await this.config.getAuthHeaders();

      // Execute all batches in parallel
      const batchResults = await Promise.all(
        batches.map((batchItemIds) =>
          this.config.client.batchGetOrCreate({
            userId: this.config.userId,
            itemIds: batchItemIds,
            baseUrl: this.config.baseUrl,
            authHeaders,
          }),
        ),
      );

      // Flatten results and create lookup map
      const allItems = batchResults.flat();
      const itemsMap = new Map<string, DismissibleItem>();
      for (const item of allItems) {
        itemsMap.set(item.itemId, item);
        // Update cache with fetched items
        this.cache.set(item.itemId, item);
      }

      // Resolve all pending requests
      for (const [itemId, itemRequests] of itemIdToRequests) {
        const item = itemsMap.get(itemId);
        if (item) {
          for (const request of itemRequests) {
            request.resolve(item);
          }
        } else {
          // Item not found in response - this shouldn't happen with getOrCreate
          const error = new Error(`Item ${itemId} not found in batch response`);
          for (const request of itemRequests) {
            request.reject(error);
          }
        }
      }
    } catch (error) {
      // Reject all pending requests on error
      const err =
        error instanceof Error ? error : new Error("Batch request failed");
      for (const request of requests) {
        request.reject(err);
      }
    }
  }
}
