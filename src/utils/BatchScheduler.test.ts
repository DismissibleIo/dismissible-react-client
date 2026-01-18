import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchScheduler } from "./BatchScheduler";
import { DismissibleClient, DismissibleItem } from "../types/dismissible.types";

const createMockClient = (): DismissibleClient => ({
  getOrCreate: vi.fn(),
  batchGetOrCreate: vi.fn(),
  dismiss: vi.fn(),
  restore: vi.fn(),
});

const createMockItem = (itemId: string): DismissibleItem => ({
  itemId,
  userId: "test-user",
  createdAt: "2023-01-01T00:00:00Z",
  dismissedAt: undefined,
});

describe("BatchScheduler", () => {
  let mockClient: DismissibleClient;
  let scheduler: BatchScheduler;

  beforeEach(() => {
    mockClient = createMockClient();
    scheduler = new BatchScheduler({
      userId: "test-user",
      baseUrl: "https://api.test.com",
      client: mockClient,
      getAuthHeaders: async () => ({ Authorization: "Bearer test-token" }),
    });
  });

  describe("request batching", () => {
    it("should batch multiple requests in the same tick", async () => {
      const items = [
        createMockItem("item-1"),
        createMockItem("item-2"),
        createMockItem("item-3"),
      ];
      (
        mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>
      ).mockResolvedValue(items);

      // Make multiple requests in the same tick
      const promise1 = scheduler.getItem("item-1");
      const promise2 = scheduler.getItem("item-2");
      const promise3 = scheduler.getItem("item-3");

      const results = await Promise.all([promise1, promise2, promise3]);

      // Should only make one batch call
      expect(mockClient.batchGetOrCreate).toHaveBeenCalledTimes(1);
      expect(mockClient.batchGetOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "test-user",
          itemIds: ["item-1", "item-2", "item-3"],
          baseUrl: "https://api.test.com",
          authHeaders: { Authorization: "Bearer test-token" },
        }),
      );

      expect(results).toEqual(items);
    });

    it("should dedupe requests for the same item in the same batch", async () => {
      const item = createMockItem("item-1");
      (
        mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>
      ).mockResolvedValue([item]);

      // Make duplicate requests for the same item
      const promise1 = scheduler.getItem("item-1");
      const promise2 = scheduler.getItem("item-1");
      const promise3 = scheduler.getItem("item-1");

      const results = await Promise.all([promise1, promise2, promise3]);

      // Should only make one batch call with one item
      expect(mockClient.batchGetOrCreate).toHaveBeenCalledTimes(1);
      expect(mockClient.batchGetOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          itemIds: ["item-1"],
        }),
      );

      // All promises should resolve to the same item
      expect(results).toEqual([item, item, item]);
    });

    it("should make separate batch calls for requests in different ticks", async () => {
      const item1 = createMockItem("item-1");
      const item2 = createMockItem("item-2");
      (mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([item1])
        .mockResolvedValueOnce([item2]);

      // First batch
      const result1 = await scheduler.getItem("item-1");

      // Second batch (new tick)
      const result2 = await scheduler.getItem("item-2");

      expect(mockClient.batchGetOrCreate).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(item1);
      expect(result2).toEqual(item2);
    });
  });

  describe("caching", () => {
    it("should return cached items without making API calls", async () => {
      const item = createMockItem("item-1");
      scheduler.primeCache(item);

      const result = await scheduler.getItem("item-1");

      expect(mockClient.batchGetOrCreate).not.toHaveBeenCalled();
      expect(result).toEqual(item);
    });

    it("should update cache after successful batch fetch", async () => {
      const item = createMockItem("item-1");
      (
        mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>
      ).mockResolvedValue([item]);

      // First request - should fetch
      await scheduler.getItem("item-1");
      expect(mockClient.batchGetOrCreate).toHaveBeenCalledTimes(1);

      // Second request - should use cache
      const result = await scheduler.getItem("item-1");
      expect(mockClient.batchGetOrCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(item);
    });

    it("should allow updating cached items", async () => {
      const item = createMockItem("item-1");
      const updatedItem = { ...item, dismissedAt: "2023-01-02T00:00:00Z" };

      scheduler.primeCache(item);
      scheduler.updateCache(updatedItem);

      const result = await scheduler.getItem("item-1");
      expect(result.dismissedAt).toBe("2023-01-02T00:00:00Z");
    });

    it("should clear cache when requested", async () => {
      const item = createMockItem("item-1");
      scheduler.primeCache(item);

      scheduler.clearCache();

      (
        mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>
      ).mockResolvedValue([item]);
      await scheduler.getItem("item-1");

      // Should fetch after cache clear
      expect(mockClient.batchGetOrCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should reject all pending requests on batch failure", async () => {
      (
        mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("API Error"));

      const promise1 = scheduler.getItem("item-1");
      const promise2 = scheduler.getItem("item-2");

      await expect(promise1).rejects.toThrow("API Error");
      await expect(promise2).rejects.toThrow("API Error");
    });

    it("should reject with error for missing items in response", async () => {
      // Response doesn't include item-2
      const item1 = createMockItem("item-1");
      (
        mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>
      ).mockResolvedValue([item1]);

      const promise1 = scheduler.getItem("item-1");
      const promise2 = scheduler.getItem("item-2");

      const result1 = await promise1;
      expect(result1).toEqual(item1);

      await expect(promise2).rejects.toThrow(
        "Item item-2 not found in batch response",
      );
    });
  });

  describe("batch size limits", () => {
    it("should respect maxBatchSize configuration", async () => {
      const customScheduler = new BatchScheduler({
        userId: "test-user",
        baseUrl: "https://api.test.com",
        client: mockClient,
        getAuthHeaders: async () => ({}),
        maxBatchSize: 2,
      });

      const items = [
        createMockItem("item-1"),
        createMockItem("item-2"),
        createMockItem("item-3"),
      ];

      (mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([items[0], items[1]])
        .mockResolvedValueOnce([items[2]]);

      const promises = [
        customScheduler.getItem("item-1"),
        customScheduler.getItem("item-2"),
        customScheduler.getItem("item-3"),
      ];

      await Promise.all(promises);

      // Should make 2 batch calls due to maxBatchSize of 2
      expect(mockClient.batchGetOrCreate).toHaveBeenCalledTimes(2);
      expect(mockClient.batchGetOrCreate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ itemIds: ["item-1", "item-2"] }),
      );
      expect(mockClient.batchGetOrCreate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ itemIds: ["item-3"] }),
      );
    });
  });

  describe("in-flight deduplication", () => {
    it("should return same promise for concurrent requests of same item", async () => {
      const item = createMockItem("item-1");
      (
        mockClient.batchGetOrCreate as ReturnType<typeof vi.fn>
      ).mockResolvedValue([item]);

      // Get promises in the same tick
      const promise1 = scheduler.getItem("item-1");
      const promise2 = scheduler.getItem("item-1");

      // They should be the same promise instance (deduped)
      expect(promise1).toBe(promise2);

      await Promise.all([promise1, promise2]);
    });
  });
});
