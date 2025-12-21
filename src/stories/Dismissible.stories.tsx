import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { Dismissible } from "../components/Dismissible";
import { useDismissibleItem } from "../hooks/useDismissibleItem";
import { DismissibleProvider } from "../contexts/DismissibleProvider";
import "../components/Dismissible.css";
import { getBaseUrl } from "../config/api.config";
import React, { useState } from "react";

const baseUrl = getBaseUrl();
const defaultUserId = "demo-user";

const CustomLoadingComponent: React.FC<{ itemId: string }> = ({ itemId }) => (
  <div
    className="custom-loading"
    style={{
      padding: "20px",
      backgroundColor: "#f0f9ff",
      border: "1px solid #bae6fd",
      borderRadius: "4px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: "spin 1s linear infinite" }}
      >
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="#0284c7"
          strokeWidth="4"
          strokeDasharray="32"
          strokeDashoffset="8"
        />
      </svg>
      <div>
        <p style={{ margin: 0, fontWeight: "bold" }}>
          Loading content for &quot;{itemId}&quot;
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Please wait while we fetch your data...
        </p>
      </div>
    </div>
  </div>
);

const CustomErrorComponent: React.FC<{ itemId: string; error: Error }> = ({
  itemId,
  error,
}) => (
  <div
    className="custom-error"
    style={{
      padding: "16px",
      backgroundColor: "#fee2e2",
      border: "1px solid #fecaca",
      borderRadius: "4px",
      color: "#b91c1c",
    }}
    role="alert"
  >
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="#fee2e2"
          stroke="#ef4444"
          strokeWidth="2"
        />
        <path
          d="M12 8v5"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16" r="1" fill="#ef4444" />
      </svg>
      <div>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>
          Failed to load item: {itemId}
        </h3>
        <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
          {error.message}
        </p>
        <button
          style={{
            backgroundColor: "#b91c1c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
          }}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    </div>
  </div>
);

const CustomDismissButtonComponent: React.FC<{
  onDismiss: () => Promise<void>;
  ariaLabel: string;
}> = ({ onDismiss, ariaLabel }) => (
  <button
    className="custom-dismiss-button"
    onClick={onDismiss}
    aria-label={ariaLabel}
    type="button"
    style={{
      position: "absolute",
      top: "-10px",
      right: "-10px",
      width: "26px",
      height: "26px",
      borderRadius: "50%",
      background: "#ef4444",
      color: "white",
      border: "2px solid white",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: "bold",
      padding: 0,
      transition: "transform 0.2s ease, background-color 0.2s ease",
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "scale(1.1)";
      e.currentTarget.style.backgroundColor = "#dc2626";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.backgroundColor = "#ef4444";
    }}
  >
    ✕
  </button>
);

const meta = {
  title: "Components/Dismissible",
  component: Dismissible,
  decorators: [
    (Story) => (
      <DismissibleProvider userId={defaultUserId} baseUrl={baseUrl}>
        <Story />
      </DismissibleProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    docs: {
      decorators: [
        (Story: React.FC) => (
          <DismissibleProvider userId={defaultUserId} baseUrl={baseUrl}>
            <Story />
          </DismissibleProvider>
        ),
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    itemId: {
      control: "text",
      description: "Unique identifier for the dismissible item",
    },
    children: {
      control: "text",
      description: "Content to render when not dismissed",
    },
    onDismiss: {
      action: "dismissed",
      description: "Callback when item is dismissed",
    },
  },
} satisfies Meta<typeof Dismissible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    itemId: "example-dismissible",
    children:
      "This is a dismissible notification that can be closed by clicking the × button.",
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "example-dismissible",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "example-dismissible",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const WithCard: Story = {
  args: {
    itemId: "card-dismissible",
    children: (
      <div
        style={{
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9",
          maxWidth: "300px",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Card Title</h3>
        <p style={{ margin: "0", color: "#666" }}>
          This is a card that can be dismissed. Click the × button to hide it.
        </p>
      </div>
    ),
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "card-dismissible",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "card-dismissible",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const WithAlert: Story = {
  args: {
    itemId: "alert-dismissible",
    children: (
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "4px",
          color: "#155724",
          maxWidth: "400px",
        }}
      >
        <strong>Success!</strong> Your action was completed successfully.
      </div>
    ),
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "alert-dismissible",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "alert-dismissible",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const WithLongContent: Story = {
  args: {
    itemId: "long-content-dismissible",
    children: (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "6px",
          maxWidth: "500px",
        }}
      >
        <h4 style={{ margin: "0 0 12px 0" }}>Important Information</h4>
        <p style={{ margin: "0 0 12px 0", lineHeight: "1.5" }}>
          This is a longer piece of content that demonstrates how the
          dismissible component works with more substantial content. The dismiss
          button will remain positioned in the top-right corner.
        </p>
        <p style={{ margin: "0", lineHeight: "1.5", fontStyle: "italic" }}>
          You can click the × button to dismiss this entire content block.
        </p>
      </div>
    ),
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "long-content-dismissible",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "long-content-dismissible",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const LoadingState: Story = {
  args: {
    itemId: "loading-dismissible",
    children: "This content won't show because it's loading",
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  HttpResponse.json({
                    data: {
                      itemId: "loading-dismissible",
                      userId: "demo-user",
                      dismissedAt: null,
                      createdAt: "2025-07-09T12:00:00Z",
                    },
                  }),
                ),
              10000,
            ),
          );
        }),
      ],
    },
  },
};

export const ErrorState: Story = {
  args: {
    itemId: "error-dismissible",
    children: "This content won't show because there's an error",
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          });
        }),
      ],
    },
  },
};

export const InitiallyDismissed: Story = {
  args: {
    itemId: "dismissed-dismissible",
    children: "This content won't show because it's already dismissed",
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "dismissed-dismissible",
              userId: "demo-user",
              dismissedAt: "2025-07-09T12:00:00Z",
              createdAt: "2025-07-09T10:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const WithCustomComponents: Story = {
  args: {
    itemId: "custom-components",
    children:
      "This dismissible uses custom loading, error, and dismiss button components.",
    LoadingComponent: CustomLoadingComponent,
    ErrorComponent: CustomErrorComponent,
    DismissButtonComponent: CustomDismissButtonComponent,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "custom-components",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "custom-components",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const CustomLoadingState: Story = {
  args: {
    itemId: "custom-loading",
    children: "This content won't show because it's loading",
    LoadingComponent: CustomLoadingComponent,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  HttpResponse.json({
                    data: {
                      itemId: "custom-loading",
                      userId: "demo-user",
                      dismissedAt: null,
                      createdAt: "2025-07-09T12:00:00Z",
                    },
                  }),
                ),
              10000,
            ),
          );
        }),
      ],
    },
  },
};

export const CustomErrorState: Story = {
  args: {
    itemId: "custom-error",
    children: "This content won't show because there's an error",
    ErrorComponent: CustomErrorComponent,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: "The server encountered an unexpected error",
          });
        }),
      ],
    },
  },
};

export const CustomDismissButton: Story = {
  args: {
    itemId: "custom-button",
    children: (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          maxWidth: "400px",
        }}
      >
        <h4 style={{ margin: "0 0 12px 0", color: "#15803d" }}>
          Customized Dismiss Button
        </h4>
        <p style={{ margin: "0", color: "#374151" }}>
          This dismissible item has a custom styled dismiss button. Notice how
          it&apos;s a red circle with an &quot;x&quot; positioned in the
          top-right corner.
        </p>
      </div>
    ),
    DismissButtonComponent: CustomDismissButtonComponent,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "custom-button",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "custom-button",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const NoLoadingIndicator: Story = {
  args: {
    itemId: "no-loading",
    children: "This will show nothing during loading state",
    LoadingComponent: null,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  HttpResponse.json({
                    data: {
                      itemId: "no-loading",
                      userId: "demo-user",
                      dismissedAt: null,
                      createdAt: "2025-07-09T12:00:00Z",
                    },
                  }),
                ),
              3200,
            ),
          );
        }),
      ],
    },
  },
};

export const NoErrorDisplay: Story = {
  args: {
    itemId: "no-error",
    children: "This will show nothing when an error occurs",
    ErrorComponent: null,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: "Internal Server Error",
          });
        }),
      ],
    },
  },
};

export const NoDismissButton: Story = {
  args: {
    itemId: "no-dismiss-button",
    children: (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#e0f2fe",
          border: "1px solid #bae6fd",
          borderRadius: "8px",
          maxWidth: "400px",
        }}
      >
        <h4 style={{ margin: "0 0 12px 0", color: "#0369a1" }}>
          Non-dismissible Content
        </h4>
        <p style={{ margin: "0", color: "#374151" }}>
          This content is presented as dismissible but has no dismiss button.
          This could be useful for displaying content that you want to track as
          dismissible in your system but don&apos;t want to allow users to
          dismiss yet.
        </p>
      </div>
    ),
    DismissButtonComponent: null,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "no-dismiss-button",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const AllNullComponents: Story = {
  args: {
    itemId: "all-null-components",
    children: (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#fef9c3",
          border: "1px solid #fde047",
          borderRadius: "8px",
          maxWidth: "400px",
        }}
      >
        <h4 style={{ margin: "0 0 12px 0", color: "#854d0e" }}>
          Stripped Down Dismissible
        </h4>
        <p style={{ margin: "0", color: "#374151" }}>
          This dismissible has all optional components set to null. No loading
          indicator, no error display, and no dismiss button. It will simply
          show the content when available, show nothing when loading or on
          error, and cannot be dismissed by the user.
        </p>
      </div>
    ),
    LoadingComponent: null,
    ErrorComponent: null,
    DismissButtonComponent: null,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "all-null-components",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const NoLoadingErrorModeContent: Story = {
  args: {
    itemId: "special-modes-null",
    children: "This content shows normally but has no special state displays",
    LoadingComponent: null,
    ErrorComponent: null,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "special-modes-null",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "special-modes-null",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const IgnoreErrorsTrue: Story = {
  args: {
    itemId: "ignore-errors-true",
    children: (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: "#15803d" }}>
          Content Displayed Despite Error
        </h3>
        <p style={{ margin: 0, color: "#166534" }}>
          This content shows even though there&rsquo;s an API error because{" "}
          <code>ignoreErrors={true}</code>. The error is silently ignored and
          the component functions normally.
        </p>
      </div>
    ),
    ignoreErrors: true,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json(
            {
              error: {
                message: "API is temporarily unavailable",
                code: "SERVICE_UNAVAILABLE",
              },
            },
            { status: 503 },
          );
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "ignore-errors-true",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

export const IgnoreErrorsFalse: Story = {
  args: {
    itemId: "ignore-errors-false",
    children: (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: "#15803d" }}>
          This Won&rsquo;t Show
        </h3>
        <p style={{ margin: 0, color: "#166534" }}>
          This content won&rsquo;t be displayed because there&rsquo;s an API
          error and <code>ignoreErrors={false}</code> (default). Instead, the
          error component will be shown.
        </p>
      </div>
    ),
    ignoreErrors: false,
    enableCache: false,
  },
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json(
            {
              error: {
                message: "API is temporarily unavailable",
                code: "SERVICE_UNAVAILABLE",
              },
            },
            { status: 503 },
          );
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "ignore-errors-false",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

const DismissAndRestoreDemo: React.FC = () => {
  const { dismissedOn, dismiss, restore, isLoading } = useDismissibleItem(
    "restore-demo",
    { enableCache: false },
  );
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restore();
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (dismissedOn) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#f3f4f6",
          border: "1px dashed #9ca3af",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 12px 0", color: "#6b7280" }}>
          This item was dismissed on{" "}
          {new Date(dismissedOn).toLocaleDateString()}
        </p>
        <button
          onClick={handleRestore}
          disabled={isRestoring}
          style={{
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            cursor: isRestoring ? "not-allowed" : "pointer",
            opacity: isRestoring ? 0.7 : 1,
          }}
        >
          {isRestoring ? "Restoring..." : "Restore Item"}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#ecfdf5",
        border: "1px solid #a7f3d0",
        borderRadius: "8px",
        position: "relative",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0", color: "#065f46" }}>
        Dismissible with Restore
      </h4>
      <p style={{ margin: "0 0 16px 0", color: "#047857" }}>
        Click dismiss to hide this content, then use the restore button to bring
        it back.
      </p>
      <button
        onClick={dismiss}
        style={{
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Dismiss
      </button>
    </div>
  );
};

export const WithRestoreFunction: Story = {
  args: {
    itemId: "restore-demo",
    children: "This will be replaced by the custom component",
    enableCache: false,
  },
  render: () => <DismissAndRestoreDemo />,
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "restore-demo",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "restore-demo",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
        http.post(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "restore-demo",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T12:00:00Z",
            },
          });
        }),
      ],
    },
  },
};

const InitiallyDismissedWithRestore: React.FC = () => {
  const { dismissedOn, dismiss, restore, isLoading } = useDismissibleItem(
    "initially-dismissed-restore",
    { enableCache: false },
  );
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restore();
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (dismissedOn) {
    return (
      <div
        style={{
          padding: "20px",
          backgroundColor: "#fef3c7",
          border: "1px solid #fcd34d",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#92400e" }}>
          Item Previously Dismissed
        </h4>
        <p style={{ margin: "0 0 12px 0", color: "#b45309" }}>
          This item was dismissed. Click below to restore it.
        </p>
        <button
          onClick={handleRestore}
          disabled={isRestoring}
          style={{
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "10px 20px",
            cursor: isRestoring ? "not-allowed" : "pointer",
            opacity: isRestoring ? 0.7 : 1,
            fontWeight: "bold",
          }}
        >
          {isRestoring ? "Restoring..." : "🔄 Restore This Item"}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#dbeafe",
        border: "1px solid #93c5fd",
        borderRadius: "8px",
        position: "relative",
      }}
    >
      <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>
        Item Has Been Restored!
      </h4>
      <p style={{ margin: "0 0 16px 0", color: "#1d4ed8" }}>
        The item is now visible again. You can dismiss it once more if needed.
      </p>
      <button
        onClick={dismiss}
        style={{
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        Dismiss Again
      </button>
    </div>
  );
};

export const InitiallyDismissedWithRestoreOption: Story = {
  args: {
    itemId: "initially-dismissed-restore",
    children: "This will be replaced by the custom component",
    enableCache: false,
  },
  render: () => <InitiallyDismissedWithRestore />,
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "initially-dismissed-restore",
              userId: "demo-user",
              dismissedAt: "2025-07-09T12:00:00Z",
              createdAt: "2025-07-09T10:00:00Z",
            },
          });
        }),
        http.delete(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "initially-dismissed-restore",
              userId: "demo-user",
              dismissedAt: new Date().toISOString(),
              createdAt: "2025-07-09T10:00:00Z",
            },
          });
        }),
        http.post(`${baseUrl}/v1/users/:userId/items/:itemId`, () => {
          return HttpResponse.json({
            data: {
              itemId: "initially-dismissed-restore",
              userId: "demo-user",
              dismissedAt: null,
              createdAt: "2025-07-09T10:00:00Z",
            },
          });
        }),
      ],
    },
  },
};
