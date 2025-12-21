import type { Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import React from "react";
import { DismissibleProvider } from "../src/contexts/DismissibleProvider";
import { getBaseUrl } from "../src/config/api.config";

// Initialize MSW - let the addon handle everything
initialize({
  onUnhandledRequest: "bypass",
  quiet: false, // Enable logging to help debug MSW issues
});

// Default user ID for stories
const defaultUserId = "demo-user";
const baseUrl = getBaseUrl();

// Simple MSW status indicator that doesn't interfere with the addon
const MSWStatusIndicator: React.FC = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        padding: "6px 10px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "bold",
        zIndex: 9999,
        backgroundColor: "#10b981",
        color: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      🔧 MSW: ON
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Configure autodocs to properly inherit MSW handlers from stories
    docs: {
      story: {
        inline: true, // Render stories inline in docs - this is key for MSW to work
        height: 'auto',
      },
    },
    // Global MSW configuration
    msw: {
      handlers: [], // Default empty handlers, individual stories will override
    },
  },
  // Add decorators that show MSW status and wrap Dismissible components with provider
  decorators: [
    (Story, context) => {
      // Only show status indicator in story view, not in docs view
      const isDocsView = context.viewMode === 'docs';
      
      // Check if this is a Dismissible component story
      const isDismissibleStory = context.title === "Components/Dismissible";
      
      // Wrap Dismissible stories with provider (needed for both Canvas and Docs)
      if (isDismissibleStory) {
        return (
          <>
            {!isDocsView && <MSWStatusIndicator />}
            <DismissibleProvider userId={defaultUserId} baseUrl={baseUrl}>
              <Story />
            </DismissibleProvider>
          </>
        );
      }
      
      return (
        <>
          {!isDocsView && <MSWStatusIndicator />}
          <Story />
        </>
      );
    },
  ],
  loaders: [mswLoader], // Use the standard MSW loader
};

export default preview;