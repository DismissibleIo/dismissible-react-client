import { setupWorker } from "msw/browser";

// Create and export the worker instance
export const worker = setupWorker();

// Don't auto-start the worker - let the MSWProvider control it
// This allows for dynamic toggling in Storybook
