import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { DismissibleProvider } from "../contexts/DismissibleProvider";
import { useDismissibleItem } from "./useDismissibleItem";

const { mockGet, mockDelete } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockDelete = vi.fn();
  return { mockGet, mockDelete };
});

vi.mock("openapi-fetch", () => ({
  default: vi.fn().mockImplementation((config) => {
    // Store the config for verification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockGet as any).lastConfig = config;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockDelete as any).lastConfig = config;
    return {
      GET: mockGet,
      DELETE: mockDelete,
    };
  }),
}));

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

const mockItemData = {
  id: "test-item",
  dismissedAt: null,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
};

const mockDismissedItemData = {
  ...mockItemData,
  dismissedAt: "2023-01-01T01:00:00Z",
};

describe("useDismissibleItem with Context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("should use userId and JWT from context in API calls", async () => {
    const userId = "user-123";
    const jwt = "context-jwt-token";

    mockGet.mockResolvedValue({
      data: { data: mockItemData },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DismissibleProvider
        userId={userId}
        jwt={jwt}
        baseUrl="https://api.context.com"
      >
        {children}
      </DismissibleProvider>
    );

    const { result } = renderHook(() => useDismissibleItem("test-item"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((mockGet as any).lastConfig).toEqual({
      baseUrl: "https://api.context.com",
      headers: {},
    });

    // Verify that the request was made with auth headers and userId in path
    expect(mockGet).toHaveBeenCalledWith(
      "/v1/users/{userId}/items/{itemId}",
      expect.objectContaining({
        params: {
          path: {
            userId: "user-123",
            itemId: "test-item",
          },
        },
        headers: {
          Authorization: "Bearer context-jwt-token",
        },
      }),
    );
  });

  it("should use dynamic JWT function from context", async () => {
    const userId = "user-123";
    const dynamicJwt = vi.fn().mockReturnValue("dynamic-jwt-token");

    mockGet.mockResolvedValue({
      data: { data: mockItemData },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DismissibleProvider
        userId={userId}
        jwt={dynamicJwt}
        baseUrl="https://api.dynamic.com"
      >
        {children}
      </DismissibleProvider>
    );

    const { result } = renderHook(() => useDismissibleItem("test-item"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(dynamicJwt).toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((mockGet as any).lastConfig).toEqual({
      baseUrl: "https://api.dynamic.com",
      headers: {},
    });

    // Verify that the request was made with auth headers and userId in path
    expect(mockGet).toHaveBeenCalledWith(
      "/v1/users/{userId}/items/{itemId}",
      expect.objectContaining({
        params: {
          path: {
            userId: "user-123",
            itemId: "test-item",
          },
        },
        headers: {
          Authorization: "Bearer dynamic-jwt-token",
        },
      }),
    );
  });

  it("should throw error without context", () => {
    expect(() => {
      renderHook(() => useDismissibleItem("test-item"));
    }).toThrow(
      "useDismissibleContext must be used within a DismissibleProvider",
    );
  });

  it("should use user-aware cache keys", async () => {
    const userId = "user-123";
    const jwt = "auth-token";

    mockGet.mockResolvedValue({
      data: { data: mockItemData },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DismissibleProvider
        userId={userId}
        jwt={jwt}
        baseUrl="https://api.test.com"
      >
        {children}
      </DismissibleProvider>
    );

    const { result } = renderHook(() => useDismissibleItem("test-item"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "dismissible_user-123-test-item",
      expect.any(String),
    );
  });

  it("should use different cache keys for different users", async () => {
    mockGet.mockResolvedValue({
      data: { data: mockItemData },
      error: null,
    });

    const wrapper1 = ({ children }: { children: React.ReactNode }) => (
      <DismissibleProvider
        userId="user-1"
        jwt="token-1"
        baseUrl="https://api.test.com"
      >
        {children}
      </DismissibleProvider>
    );

    const { result: result1 } = renderHook(
      () => useDismissibleItem("test-item"),
      { wrapper: wrapper1 },
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "dismissible_user-1-test-item",
      expect.any(String),
    );

    vi.clearAllMocks();
    localStorageMock.clear();

    const wrapper2 = ({ children }: { children: React.ReactNode }) => (
      <DismissibleProvider
        userId="user-2"
        jwt="token-2"
        baseUrl="https://api.test.com"
      >
        {children}
      </DismissibleProvider>
    );

    const { result: result2 } = renderHook(
      () => useDismissibleItem("test-item"),
      { wrapper: wrapper2 },
    );

    await waitFor(() => {
      expect(result2.current.isLoading).toBe(false);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "dismissible_user-2-test-item",
      expect.any(String),
    );
  });

  it("should dismiss items with userId in path", async () => {
    const userId = "user-123";
    const jwt = "auth-token";

    mockGet.mockResolvedValue({
      data: { data: mockItemData },
      error: null,
    });

    mockDelete.mockResolvedValue({
      data: { data: mockDismissedItemData },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DismissibleProvider
        userId={userId}
        jwt={jwt}
        baseUrl="https://api.test.com"
      >
        {children}
      </DismissibleProvider>
    );

    const { result } = renderHook(() => useDismissibleItem("test-item"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.dismiss();
    });

    expect(mockDelete).toHaveBeenCalledWith(
      "/v1/users/{userId}/items/{itemId}",
      {
        params: {
          path: {
            userId: "user-123",
            itemId: "test-item",
          },
        },
        headers: {
          Authorization: "Bearer auth-token",
        },
      },
    );

    expect(result.current.dismissedAt).toBe("2023-01-01T01:00:00Z");
  });

  it("should handle JWT function errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const userId = "user-123";
    const errorJwtFunction = vi.fn().mockImplementation(() => {
      throw new Error("JWT fetch failed");
    });

    mockGet.mockResolvedValue({
      data: { data: mockItemData },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DismissibleProvider
        userId={userId}
        jwt={errorJwtFunction}
        baseUrl="https://api.test.com"
      >
        {children}
      </DismissibleProvider>
    );

    const { result } = renderHook(() => useDismissibleItem("test-item"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((mockGet as any).lastConfig).toEqual({
      baseUrl: "https://api.test.com",
      headers: {},
    });

    consoleSpy.mockRestore();
  });
});
