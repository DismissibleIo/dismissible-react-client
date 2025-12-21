import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import React, { useState } from "react";
import { DismissibleProvider } from "../contexts/DismissibleProvider";
import { Dismissible } from "../components/Dismissible";
import { useDismissibleItem } from "../hooks/useDismissibleItem";
import { getBaseUrl } from "../config/api.config";

// Get API base URL for consistent endpoint mocking
const baseUrl = getBaseUrl();

const meta = {
  title: "Contexts/DismissibleProvider",
  component: DismissibleProvider,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    userId: {
      control: "text",
      description: "User ID for the current user (required for all API calls)",
    },
    jwt: {
      control: "text",
      description: "JWT token for authentication (string or function)",
    },
    baseUrl: {
      control: "text",
      description: "Base URL for API requests",
    },
    children: {
      control: false,
      description: "Child components to render within the provider",
    },
  },
} satisfies Meta<typeof DismissibleProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Demo component that uses the dismissible hook
const DismissibleDemo: React.FC<{ id: string }> = ({ id }) => {
  const { dismissedOn, dismiss, isLoading, error } = useDismissibleItem(id, {
    enableCache: false,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (dismissedOn) {
    return (
      <div
        style={{ padding: "16px", background: "#f0f0f0", borderRadius: "4px" }}
      >
        <p>Item was dismissed on: {dismissedOn}</p>
        <p>
          <em>This item is dismissed and would not show in a real app.</em>
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        maxWidth: "400px",
      }}
    >
      <h3>Dismissible Notification</h3>
      <p>
        This is a dismissible notification that can be dismissed by clicking the
        button below.
      </p>
      <p>
        <strong>Item ID:</strong> {id}
      </p>
      <button
        onClick={dismiss}
        style={{
          padding: "8px 16px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Dismiss
      </button>
    </div>
  );
};

// Demo component that shows multiple dismissible items
const MultipleDismissibleDemo: React.FC<{ prefix?: string }> = ({
  prefix = "",
}) => {
  const getUniqueId = (baseId: string) =>
    prefix ? `${prefix}-${baseId}` : baseId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <DismissibleDemo id={getUniqueId("notification-1")} />
      <DismissibleDemo id={getUniqueId("notification-2")} />
      <DismissibleDemo id={getUniqueId("notification-3")} />
    </div>
  );
};

// Demo with JWT token input (using mock localhost endpoint)
const JWTTokenDemo: React.FC = () => {
  const [userId, setUserId] = useState(defaultUserId);
  const [jwt, setJwt] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  );

  return (
    <div style={{ maxWidth: "600px" }}>
      <div
        style={{
          marginBottom: "20px",
          padding: "16px",
          background: "#f8f9fa",
          borderRadius: "4px",
        }}
      >
        <h4>Provider Configuration</h4>
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            User ID (required):
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
            placeholder="Enter user ID..."
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            JWT Token:
          </label>
          <textarea
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            style={{
              width: "100%",
              height: "60px",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "12px",
              fontFamily: "monospace",
            }}
            placeholder="Enter JWT token..."
          />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: "bold",
            }}
          >
            Base URL:
          </label>
          <input
            type="text"
            value={baseUrl}
            readOnly
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#f8f9fa",
              color: "#6c757d",
            }}
            placeholder="Using mock localhost endpoint for Storybook"
          />
        </div>
        <div
          style={{
            padding: "8px",
            backgroundColor: "#e9ecef",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#6c757d",
          }}
        >
          💡 This demo uses mocked localhost endpoints for safe testing in
          Storybook. In a real application, you would use your production API
          URL.
        </div>
      </div>

      <DismissibleProvider userId={userId} jwt={jwt} baseUrl={baseUrl}>
        <MultipleDismissibleDemo prefix="interactive" />
      </DismissibleProvider>
    </div>
  );
};

// Default user ID for stories
const defaultUserId = "demo-user";

// Helper function to create mock handlers for dismissible items
const createMockHandlers = (ids: string[]) => {
  const handlers: ReturnType<typeof http.get>[] = [];

  ids.forEach((id) => {
    // GET handler - returns non-dismissed item
    handlers.push(
      http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
        return HttpResponse.json({
          data: {
            itemId: id,
            userId: defaultUserId,
            dismissedAt: null,
            createdAt: "2025-07-28T12:00:00Z",
          },
        });
      }),
    );

    // DELETE handler - dismisses the item
    handlers.push(
      http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
        return HttpResponse.json({
          data: {
            itemId: id,
            userId: defaultUserId,
            dismissedAt: new Date().toISOString(),
            createdAt: "2025-07-28T12:00:00Z",
          },
        });
      }),
    );
  });

  return handlers;
};

export const BasicUsage: Story = {
  args: {
    userId: defaultUserId,
    children: (
      <div>
        <h3>Basic Provider Usage</h3>
        <p>
          This demonstrates the provider with just the required userId prop.
        </p>
        <DismissibleDemo id="basic-demo" />
      </div>
    ),
  },
  parameters: {
    msw: {
      handlers: createMockHandlers(["basic-demo"]),
    },
  },
};

export const WithStaticJWT: Story = {
  args: {
    userId: defaultUserId,
    jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    baseUrl: baseUrl,
    children: (
      <div>
        <h3>With Static JWT Token</h3>
        <p>This demonstrates using a static JWT token with the provider.</p>
        <MultipleDismissibleDemo prefix="static-jwt" />
      </div>
    ),
  },
  parameters: {
    msw: {
      handlers: createMockHandlers([
        "static-jwt-notification-1",
        "static-jwt-notification-2",
        "static-jwt-notification-3",
      ]),
    },
  },
};

export const WithDynamicJWT: Story = {
  args: {
    userId: defaultUserId,
    jwt: () => {
      console.log("Fetching JWT token dynamically...");
      return `dynamic-token-${Date.now()}`;
    },
    baseUrl: baseUrl,
    children: (
      <div>
        <h3>With Dynamic JWT Function</h3>
        <p>
          This demonstrates using a function to dynamically provide JWT tokens.
        </p>
        <p>
          <em>Check the console to see when the JWT function is called.</em>
        </p>
        <MultipleDismissibleDemo prefix="dynamic-jwt" />
      </div>
    ),
  },
  parameters: {
    msw: {
      handlers: createMockHandlers([
        "dynamic-jwt-notification-1",
        "dynamic-jwt-notification-2",
        "dynamic-jwt-notification-3",
      ]),
    },
  },
};

export const WithCustomBaseUrl: Story = {
  args: {
    userId: defaultUserId,
    jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    baseUrl: baseUrl, // Use mock localhost instead of real staging URL
    children: (
      <div>
        <h3>With Custom Base URL</h3>
        <p>
          This demonstrates overriding the default API base URL (using localhost
          mock).
        </p>
        <MultipleDismissibleDemo prefix="custom-url" />
      </div>
    ),
  },
  parameters: {
    msw: {
      handlers: createMockHandlers([
        "custom-url-notification-1",
        "custom-url-notification-2",
        "custom-url-notification-3",
      ]),
    },
  },
};

export const InteractiveDemo: Story = {
  args: {
    userId: defaultUserId,
    children: <JWTTokenDemo />,
  },
  render: () => <JWTTokenDemo />,
  parameters: {
    msw: {
      handlers: createMockHandlers([
        "interactive-notification-1",
        "interactive-notification-2",
        "interactive-notification-3",
      ]),
    },
  },
};

export const WithExistingDismissibleComponent: Story = {
  args: {
    userId: defaultUserId,
    jwt: "demo-jwt-token",
    baseUrl: baseUrl,
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3>Integration with Existing Dismissible Component</h3>
        <p>
          This shows how the provider works with the existing Dismissible
          component.
        </p>

        <Dismissible itemId="dismissible-component-demo" enableCache={false}>
          <div
            style={{
              padding: "16px",
              background: "#e7f3ff",
              border: "1px solid #b8daff",
              borderRadius: "4px",
            }}
          >
            <h4>Information Notice</h4>
            <p>
              This is a dismissible information notice using the Dismissible
              component with authentication.
            </p>
          </div>
        </Dismissible>

        <Dismissible itemId="dismissible-component-demo-2" enableCache={false}>
          <div
            style={{
              padding: "16px",
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "4px",
            }}
          >
            <h4>Warning Notice</h4>
            <p>
              This is another dismissible warning notice to demonstrate multiple
              items.
            </p>
          </div>
        </Dismissible>
      </div>
    ),
  },
  parameters: {
    msw: {
      handlers: createMockHandlers([
        "dismissible-component-demo",
        "dismissible-component-demo-2",
      ]),
    },
  },
};
