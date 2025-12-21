import React, { useState, useEffect } from "react";
import { useDismissibleItem } from "../hooks/useDismissibleItem";
import "./Dismissible.css";

/**
 * Props for the Dismissible component
 */
export interface DismissibleProps {
  /** Unique identifier for the dismissible item */
  itemId: string;
  /** Content to render when the item is not dismissed */
  children: React.ReactNode;
  /** Optional callback when item is dismissed */
  onDismiss?: () => void;
  /** Optional custom loading component */
  LoadingComponent?: React.ComponentType<{ itemId: string }> | null;
  /** Optional custom error component */
  ErrorComponent?: React.ComponentType<{
    itemId: string;
    error: Error;
  }> | null;
  /** Optional custom dismiss button component */
  DismissButtonComponent?: React.ComponentType<{
    onDismiss: () => Promise<void>;
    ariaLabel: string;
  }> | null;
  /** Enable localStorage caching (default: true) */
  enableCache?: boolean;
  /** Cache key prefix (default: 'dismissible') */
  cachePrefix?: string;
  /** Cache expiration time in milliseconds (default: never expires) */
  cacheExpiration?: number;
  /** Ignore errors and display the component anyway (default: false) */
  ignoreErrors?: boolean;
}

/**
 * Default Loading Component
 */
const DefaultLoadingComponent: React.FC<{ itemId: string }> = () => (
  <div className="dismissible-loading" aria-live="polite">
    Loading...
  </div>
);

/**
 * Default Error Component
 */
const DefaultErrorComponent: React.FC<{
  itemId: string;
  error: Error;
}> = () => (
  <div className="dismissible-error" role="alert">
    Unable to load content. Please try again later.
  </div>
);

/**
 * Default Dismiss Button Component
 */
const DefaultDismissButtonComponent: React.FC<{
  onDismiss: () => Promise<void>;
  ariaLabel: string;
}> = ({ onDismiss, ariaLabel }) => (
  <button
    className="dismissible-button"
    onClick={onDismiss}
    aria-label={ariaLabel}
    type="button"
  >
    ×
  </button>
);

/**
 * A wrapper component that can be dismissed and hidden by users
 *
 * @param id - Unique identifier for the dismissible item
 * @param children - Content to render when not dismissed
 * @param onDismiss - Optional callback when item is dismissed
 * @param onRestore - Optional callback when item is restored
 * @param LoadingComponent - Optional custom loading component
 * @param ErrorComponent - Optional custom error component
 * @param DismissButtonComponent - Optional custom dismiss button component
 * @param enableCache - Enable localStorage caching
 * @param cachePrefix - Cache key prefix
 * @param cacheExpiration - Cache expiration time in milliseconds
 * @param ignoreErrors - Ignore errors and display the component anyway
 * @returns JSX element or null if dismissed
 */
export const Dismissible: React.FC<DismissibleProps> = ({
  itemId,
  children,
  onDismiss,
  LoadingComponent = DefaultLoadingComponent,
  ErrorComponent = DefaultErrorComponent,
  DismissButtonComponent = DefaultDismissButtonComponent,
  enableCache,
  cachePrefix,
  cacheExpiration,
  ignoreErrors = false,
}) => {
  // Note: The hook also returns `restore` for restoring dismissed items.
  // For restore functionality, use the useDismissibleItem hook directly in custom implementations.
  const { dismissedOn, isLoading, error, dismiss } = useDismissibleItem(
    itemId,
    {
      enableCache,
      cachePrefix,
      cacheExpiration,
    },
  );

  const [isDismissing, setIsDismissing] = useState(false);

  // Reset isDismissing when itemId changes
  useEffect(() => {
    setIsDismissing(false);
  }, [itemId]);

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await dismiss();
      onDismiss?.();
    } catch {
      setIsDismissing(false);
    }
  };

  // Show loading state
  if (isLoading && LoadingComponent) {
    return <LoadingComponent itemId={itemId} />;
  }

  // Hide content if loading and no LoadingComponent
  if (isLoading && !LoadingComponent) {
    return null;
  }

  // Show error state (unless ignoring errors)
  if (error && ErrorComponent && !ignoreErrors) {
    return <ErrorComponent itemId={itemId} error={error} />;
  }

  // Hide content if dismissed or currently dismissing
  if (dismissedOn || isDismissing) {
    return null;
  }

  // Show content with dismiss functionality
  return (
    <div className="dismissible-container">
      <div className="dismissible-content">{children}</div>
      {DismissButtonComponent ? (
        <DismissButtonComponent
          onDismiss={handleDismiss}
          ariaLabel={`Dismiss ${itemId}`}
        />
      ) : null}
    </div>
  );
};
