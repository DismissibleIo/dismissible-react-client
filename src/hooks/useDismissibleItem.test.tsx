import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";

const { mockGet, mockDelete, mockPost } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockDelete = vi.fn();
  const mockPost = vi.fn();
  return { mockGet, mockDelete, mockPost };
});

vi.mock("openapi-fetch", () => ({
  default: () => ({
    GET: mockGet,
    DELETE: mockDelete,
    POST: mockPost,
  }),
}));

// Helper to setup batch POST mock (used for initial fetch via BatchScheduler)
const setupBatchMock = (
  items: Array<{ itemId: string; [key: string]: unknown }>,
) => {
  mockPost.mockImplementation(async (path: string) => {
    if (path === "/v1/users/{userId}/items") {
      return {
        data: { data: items },
        error: null,
      };
    }
    // Individual restore endpoint
    const item = items.find((i) => path.includes(i.itemId));
    return {
      data: { data: item },
      error: null,
    };
  });
};

import { useDismissibleItem } from "./useDismissibleItem";
import { DismissibleProvider } from "../contexts/DismissibleProvider";

const defaultUserId = "test-user";
const defaultBaseUrl = "https://api.test.com";
const createWrapper = (userId: string = defaultUserId) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <DismissibleProvider userId={userId} baseUrl={defaultBaseUrl}>
      {children}
    </DismissibleProvider>
  );
  Wrapper.displayName = "TestDismissibleWrapper";
  return Wrapper;
};

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useDismissibleItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockGet.mockReset();
    mockDelete.mockReset();
    mockPost.mockReset();
  });

  describe("without caching", () => {
    it("fetches item data on mount via batch endpoint", async () => {
      const mockItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: null,
        createdAt: "2023-01-01",
      };

      setupBatchMock([mockItem]);

      const { result } = renderHook(
        () => useDismissibleItem("test-id", { enableCache: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dismissedAt).toBeNull();
      expect(result.current.error).toBeUndefined();
      // Verify batch endpoint was called
      expect(mockPost).toHaveBeenCalledWith(
        "/v1/users/{userId}/items",
        expect.objectContaining({
          params: {
            path: {
              userId: "test-user",
            },
          },
          body: {
            items: ["test-id"],
          },
          headers: {},
        }),
      );
    });

    it("uses batch endpoint with userId in path", async () => {
      const mockItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: undefined,
        createdAt: "2023-01-01",
      };

      setupBatchMock([mockItem]);

      const { result } = renderHook(
        () => useDismissibleItem("test-id", { enableCache: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dismissedAt).toBeUndefined();
      expect(result.current.error).toBeUndefined();
      expect(mockPost).toHaveBeenCalledWith(
        "/v1/users/{userId}/items",
        expect.objectContaining({
          params: {
            path: {
              userId: "test-user",
            },
          },
          body: {
            items: ["test-id"],
          },
          headers: {},
        }),
      );
    });

    it("dismisses an item", async () => {
      const mockItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: undefined,
        createdAt: "2023-01-01",
      };

      const dismissedItem = {
        ...mockItem,
        dismissedAt: "2023-01-02",
      };

      setupBatchMock([mockItem]);

      mockDelete.mockResolvedValueOnce({
        data: { data: dismissedItem },
        error: null,
      });

      const { result } = renderHook(
        () => useDismissibleItem("test-id", { enableCache: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.dismiss();
      });

      expect(result.current.dismissedAt).toBe("2023-01-02");
      expect(mockDelete).toHaveBeenCalledWith(
        "/v1/users/{userId}/items/{itemId}",
        {
          params: {
            path: {
              userId: "test-user",
              itemId: "test-id",
            },
          },
          headers: {},
        },
      );
    });

    it("restores a dismissed item", async () => {
      const dismissedItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: "2023-01-02",
        createdAt: "2023-01-01",
      };

      const restoredItem = {
        ...dismissedItem,
        dismissedAt: null,
      };

      // Setup batch mock for initial fetch
      mockPost.mockImplementation(async (path: string) => {
        if (path === "/v1/users/{userId}/items") {
          return {
            data: { data: [dismissedItem] },
            error: null,
          };
        }
        // Individual restore endpoint
        return {
          data: { data: restoredItem },
          error: null,
        };
      });

      const { result } = renderHook(
        () => useDismissibleItem("test-id", { enableCache: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dismissedAt).toBe("2023-01-02");

      await act(async () => {
        await result.current.restore();
      });

      expect(result.current.dismissedAt).toBeNull();
      expect(mockPost).toHaveBeenCalledWith(
        "/v1/users/{userId}/items/{itemId}",
        {
          params: {
            path: {
              userId: "test-user",
              itemId: "test-id",
            },
          },
          headers: {},
        },
      );
    });
  });

  describe("with caching enabled", () => {
    it("uses cached data if available", async () => {
      const cachedItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: "2023-01-01",
        createdAt: "2023-01-01",
      };

      localStorageMock.setItem(
        "dismissible_test-user-test-id",
        JSON.stringify({
          data: cachedItem,
          timestamp: Date.now(),
        }),
      );

      const { result } = renderHook(() => useDismissibleItem("test-id"), {
        wrapper: createWrapper(),
      });

      // Should not be loading since we have cached data
      expect(result.current.isLoading).toBe(false);
      expect(result.current.dismissedAt).toBe("2023-01-01");

      await waitFor(() => {
        // Should not call batch endpoint since we have cached dismissed data
        expect(mockPost).not.toHaveBeenCalledWith(
          "/v1/users/{userId}/items",
          expect.anything(),
        );
      });
    });

    it("fetches from API if cache is expired", async () => {
      const cachedItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: "2023-01-01",
        createdAt: "2023-01-01",
      };

      localStorageMock.setItem(
        "dismissible_test-user-test-id",
        JSON.stringify({
          data: cachedItem,
          timestamp: Date.now() - 3600001,
        }),
      );

      const freshItem = {
        ...cachedItem,
        dismissedAt: null,
      };

      setupBatchMock([freshItem]);

      const { result } = renderHook(
        () =>
          useDismissibleItem("test-id", {
            cacheExpiration: 3600000, // 1 hour
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          "/v1/users/{userId}/items",
          expect.anything(),
        );
      });

      expect(result.current.dismissedAt).toBeNull();
    });

    it("updates cache when item is dismissed", async () => {
      const mockItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: null,
        createdAt: "2023-01-01",
      };

      const dismissedItem = {
        ...mockItem,
        dismissedAt: "2023-01-02",
      };

      setupBatchMock([mockItem]);

      mockDelete.mockResolvedValueOnce({
        data: { data: dismissedItem },
        error: null,
      });

      const { result } = renderHook(() => useDismissibleItem("test-id"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.dismiss();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "dismissible_test-user-test-id",
        expect.stringContaining('"dismissedAt":"2023-01-02"'),
      );
    });

    it("uses custom cache prefix", () => {
      const cachedItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: "2023-01-01",
        createdAt: "2023-01-01",
      };

      localStorageMock.setItem(
        "custom_test-user-test-id",
        JSON.stringify({
          data: cachedItem,
          timestamp: Date.now(),
        }),
      );

      const { result } = renderHook(
        () =>
          useDismissibleItem("test-id", {
            cachePrefix: "custom",
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.dismissedAt).toBe("2023-01-01");
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        "custom_test-user-test-id",
      );
    });

    it("doesn't use cache for non-dismissed items", async () => {
      const cachedItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: null,
        createdAt: "2023-01-01",
      };

      localStorageMock.setItem(
        "dismissible_test-user-test-id",
        JSON.stringify({
          data: cachedItem,
          timestamp: Date.now(),
        }),
      );

      setupBatchMock([cachedItem]);

      renderHook(() => useDismissibleItem("test-id"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          "/v1/users/{userId}/items",
          expect.anything(),
        );
      });
    });

    it("updates cache when item is restored", async () => {
      const dismissedItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: "2023-01-02",
        createdAt: "2023-01-01",
      };

      const restoredItem = {
        ...dismissedItem,
        dismissedAt: null,
      };

      // Setup batch mock for initial fetch and restore endpoint
      mockPost.mockImplementation(async (path: string) => {
        if (path === "/v1/users/{userId}/items") {
          return {
            data: { data: [dismissedItem] },
            error: null,
          };
        }
        // Individual restore endpoint
        return {
          data: { data: restoredItem },
          error: null,
        };
      });

      const { result } = renderHook(() => useDismissibleItem("test-id"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.restore();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "dismissible_test-user-test-id",
        expect.stringContaining('"dismissedAt":null'),
      );
    });
  });

  describe("error handling", () => {
    it("handles API errors gracefully", async () => {
      mockPost.mockResolvedValueOnce({
        data: null,
        error: {
          error: {
            message: "Not found",
          },
        },
      });

      const { result, unmount } = renderHook(
        () => useDismissibleItem("test-id", { enableCache: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });
      expect(result.current.error?.message).toBe(
        "Failed to batch fetch dismissible items",
      );

      // Clean up to prevent unhandled rejection warnings
      unmount();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it("handles dismiss errors", async () => {
      const mockItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: undefined,
        createdAt: "2023-01-01",
      };

      setupBatchMock([mockItem]);

      mockDelete.mockResolvedValueOnce({
        data: null,
        error: {
          error: {
            message: "Failed to dismiss",
          },
        },
      });

      const { result } = renderHook(
        () => useDismissibleItem("test-id", { enableCache: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.dismiss();
        }),
      ).rejects.toThrow("Failed to dismiss item");
    });

    it("handles restore errors", async () => {
      const dismissedItem = {
        itemId: "test-id",
        userId: "test-user",
        dismissedAt: "2023-01-02",
        createdAt: "2023-01-01",
      };

      // Setup batch mock for initial fetch but make restore fail
      mockPost.mockImplementation(async (path: string) => {
        if (path === "/v1/users/{userId}/items") {
          return {
            data: { data: [dismissedItem] },
            error: null,
          };
        }
        // Individual restore endpoint - fail
        return {
          data: null,
          error: {
            error: {
              message: "Failed to restore",
            },
          },
        };
      });

      const { result } = renderHook(
        () => useDismissibleItem("test-id", { enableCache: false }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.restore();
        }),
      ).rejects.toThrow("Failed to restore item");
    });
  });
});
