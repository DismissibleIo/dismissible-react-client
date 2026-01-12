import React, { useEffect, useState } from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DismissibleProvider } from "./DismissibleProvider";
import { useDismissibleContext } from "./DismissibleContext";
import { DismissibleClient } from "../types/dismissible.types";

const TestComponent: React.FC = () => {
  const context = useDismissibleContext();
  const [authHeaders, setAuthHeaders] = useState<string>("{}");

  useEffect(() => {
    context
      .getAuthHeaders()
      .then((headers) => setAuthHeaders(JSON.stringify(headers)))
      .catch(() => setAuthHeaders("{}"));
  }, [context]);

  return (
    <div>
      <div data-testid="has-context">true</div>
      <div data-testid="user-id">{context.userId}</div>
      <div data-testid="jwt">
        {typeof context.jwt === "function"
          ? "function"
          : context.jwt || "undefined"}
      </div>
      <div data-testid="base-url">{context.baseUrl}</div>
      <div data-testid="auth-headers">{authHeaders}</div>
      <div data-testid="has-client">{context.client ? "true" : "false"}</div>
    </div>
  );
};

describe("DismissibleProvider", () => {
  it("should provide context with userId and string JWT", async () => {
    const userId = "user-123";
    const jwt = "test-jwt-token";
    const baseUrl = "https://api.test.com";

    const { getByTestId } = render(
      <DismissibleProvider userId={userId} jwt={jwt} baseUrl={baseUrl}>
        <TestComponent />
      </DismissibleProvider>,
    );

    expect(getByTestId("has-context")).toHaveTextContent("true");
    expect(getByTestId("user-id")).toHaveTextContent("user-123");
    expect(getByTestId("jwt")).toHaveTextContent("test-jwt-token");
    expect(getByTestId("base-url")).toHaveTextContent("https://api.test.com");

    await waitFor(() => {
      expect(getByTestId("auth-headers")).toHaveTextContent(
        '{"Authorization":"Bearer test-jwt-token"}',
      );
    });
  });

  it("should provide context with function JWT", async () => {
    const userId = "user-123";
    const jwtFunction = vi.fn().mockReturnValue("dynamic-token");
    const baseUrl = "https://api.test.com";

    const { getByTestId } = render(
      <DismissibleProvider userId={userId} jwt={jwtFunction} baseUrl={baseUrl}>
        <TestComponent />
      </DismissibleProvider>,
    );

    expect(getByTestId("has-context")).toHaveTextContent("true");
    expect(getByTestId("user-id")).toHaveTextContent("user-123");
    expect(getByTestId("jwt")).toHaveTextContent("function");
    expect(getByTestId("base-url")).toHaveTextContent("https://api.test.com");

    await waitFor(() => {
      expect(getByTestId("auth-headers")).toHaveTextContent(
        '{"Authorization":"Bearer dynamic-token"}',
      );
    });
    expect(jwtFunction).toHaveBeenCalled();
  });

  it("should provide context without JWT", () => {
    const userId = "user-123";
    const baseUrl = "https://api.test.com";

    const { getByTestId } = render(
      <DismissibleProvider userId={userId} baseUrl={baseUrl}>
        <TestComponent />
      </DismissibleProvider>,
    );

    expect(getByTestId("has-context")).toHaveTextContent("true");
    expect(getByTestId("user-id")).toHaveTextContent("user-123");
    expect(getByTestId("jwt")).toHaveTextContent("undefined");
    expect(getByTestId("base-url")).toHaveTextContent("https://api.test.com");
    expect(getByTestId("auth-headers")).toHaveTextContent("{}");
  });

  it("should provide context with minimal configuration (userId and baseUrl)", () => {
    const userId = "user-123";
    const baseUrl = "https://api.test.com";

    const { getByTestId } = render(
      <DismissibleProvider userId={userId} baseUrl={baseUrl}>
        <TestComponent />
      </DismissibleProvider>,
    );

    expect(getByTestId("has-context")).toHaveTextContent("true");
    expect(getByTestId("user-id")).toHaveTextContent("user-123");
    expect(getByTestId("jwt")).toHaveTextContent("undefined");
    expect(getByTestId("base-url")).toHaveTextContent("https://api.test.com");
    expect(getByTestId("auth-headers")).toHaveTextContent("{}");
  });

  it("should handle JWT function errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const userId = "user-123";
    const baseUrl = "https://api.test.com";
    const errorJwtFunction = vi.fn().mockImplementation(() => {
      throw new Error("JWT fetch failed");
    });

    const { getByTestId } = render(
      <DismissibleProvider
        userId={userId}
        jwt={errorJwtFunction}
        baseUrl={baseUrl}
      >
        <TestComponent />
      </DismissibleProvider>,
    );

    expect(getByTestId("has-context")).toHaveTextContent("true");
    expect(getByTestId("user-id")).toHaveTextContent("user-123");

    await waitFor(() => {
      expect(getByTestId("auth-headers")).toHaveTextContent("{}");
    });

    consoleSpy.mockRestore();
  });

  it("should render children correctly", () => {
    const userId = "user-123";
    const baseUrl = "https://api.test.com";

    const { getByTestId } = render(
      <DismissibleProvider userId={userId} baseUrl={baseUrl}>
        <div data-testid="child">Child component</div>
      </DismissibleProvider>,
    );

    expect(getByTestId("child")).toHaveTextContent("Child component");
  });

  it("should throw error when used without provider", () => {
    expect(() => render(<TestComponent />)).toThrow(
      "useDismissibleContext must be used within a DismissibleProvider",
    );
  });

  describe("custom client injection", () => {
    it("should use custom client when provided", () => {
      const customClient: DismissibleClient = {
        getOrCreate: vi.fn(),
        dismiss: vi.fn(),
        restore: vi.fn(),
      };

      const { getByTestId } = render(
        <DismissibleProvider
          userId="user-123"
          baseUrl="https://api.test.com"
          client={customClient}
        >
          <TestComponent />
        </DismissibleProvider>,
      );

      expect(getByTestId("has-client")).toHaveTextContent("true");
    });

    it("should provide default client when none is specified", () => {
      const { getByTestId } = render(
        <DismissibleProvider userId="user-123" baseUrl="https://api.test.com">
          <TestComponent />
        </DismissibleProvider>,
      );

      expect(getByTestId("has-client")).toHaveTextContent("true");
    });

    it("should expose custom client methods via context", async () => {
      const mockItem = {
        itemId: "test-id",
        userId: "user-123",
        createdAt: "2023-01-01",
        dismissedAt: undefined,
      };

      const customClient: DismissibleClient = {
        getOrCreate: vi.fn().mockResolvedValue(mockItem),
        dismiss: vi
          .fn()
          .mockResolvedValue({ ...mockItem, dismissedAt: "2023-01-02" }),
        restore: vi.fn().mockResolvedValue(mockItem),
      };

      const capturedClientRef = { current: null as DismissibleClient | null };

      const ClientCapture: React.FC = () => {
        const context = useDismissibleContext();
        useEffect(() => {
          capturedClientRef.current = context.client;
        }, [context.client]);
        return null;
      };

      render(
        <DismissibleProvider
          userId="user-123"
          baseUrl="https://api.test.com"
          client={customClient}
        >
          <ClientCapture />
        </DismissibleProvider>,
      );

      await waitFor(() => {
        expect(capturedClientRef.current).toBe(customClient);
      });
      expect(capturedClientRef.current?.getOrCreate).toBe(
        customClient.getOrCreate,
      );
      expect(capturedClientRef.current?.dismiss).toBe(customClient.dismiss);
      expect(capturedClientRef.current?.restore).toBe(customClient.restore);
    });
  });
});
