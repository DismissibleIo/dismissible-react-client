import { createContext, useContext } from "react";
import { DismissibleContextValue } from "../types/dismissible.types";

/**
 * React context for sharing dismissible authentication state
 */
export const DismissibleContext = createContext<DismissibleContextValue | null>(
  null,
);

/**
 * Hook to consume the DismissibleContext
 * @throws Error if used outside of a DismissibleProvider
 * @returns The context value
 */
export const useDismissibleContext = (): DismissibleContextValue => {
  const context = useContext(DismissibleContext);
  if (!context) {
    throw new Error(
      "useDismissibleContext must be used within a DismissibleProvider",
    );
  }
  return context;
};
