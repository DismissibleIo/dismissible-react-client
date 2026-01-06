import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, type MockedFunction } from "vitest";
import { Dismissible } from "./Dismissible";

vi.mock("../hooks/useDismissibleItem", () => ({
  useDismissibleItem: vi.fn(),
}));

import { useDismissibleItem } from "../hooks/useDismissibleItem";

const mockUseDismissibleItem = useDismissibleItem as MockedFunction<
  typeof useDismissibleItem
>;

describe("Dismissible Component", () => {
  const mockDismiss = vi.fn();
  const mockRestore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when not dismissed", () => {
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: null,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id">
        <div>Test content</div>
      </Dismissible>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders nothing when dismissed", () => {
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: new Date().toISOString(),
      isLoading: false,
      error: null,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    const { container } = render(
      <Dismissible itemId="test-id">
        <div>Test content</div>
      </Dismissible>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders loading state with default LoadingComponent", () => {
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: true,
      error: null,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id">
        <div>Test content</div>
      </Dismissible>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
  });

  it("renders nothing when loading and LoadingComponent is null", () => {
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: true,
      error: null,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    const { container } = render(
      <Dismissible itemId="test-id" LoadingComponent={null}>
        <div>Test content</div>
      </Dismissible>,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders error state", () => {
    const mockError = new Error("Test error");
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: mockError,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id">
        <div>Test content</div>
      </Dismissible>,
    );

    expect(
      screen.getByText("Unable to load content. Please try again later."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
  });

  it("calls dismiss function when dismiss button is clicked", async () => {
    const mockAsyncDismiss = vi.fn().mockResolvedValue(undefined);
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: null,
      dismiss: mockAsyncDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id">
        <div>Test content</div>
      </Dismissible>,
    );

    const dismissButton = screen.getByRole("button");
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(mockAsyncDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onDismiss callback when item is dismissed", async () => {
    const mockOnDismiss = vi.fn();
    const mockAsyncDismiss = vi.fn().mockResolvedValue(undefined);
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: null,
      dismiss: mockAsyncDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id" onDismiss={mockOnDismiss}>
        <div>Test content</div>
      </Dismissible>,
    );

    const dismissButton = screen.getByRole("button");
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it("handles dismiss error gracefully", async () => {
    const mockError = new Error("Dismiss failed");
    const mockAsyncDismiss = vi.fn().mockRejectedValue(mockError);

    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: null,
      dismiss: mockAsyncDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id">
        <div>Test content</div>
      </Dismissible>,
    );

    const dismissButton = screen.getByRole("button");
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(mockAsyncDismiss).toHaveBeenCalled();
    });

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: null,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id">
        <div>Test content</div>
      </Dismissible>,
    );

    const dismissButton = screen.getByRole("button");
    expect(dismissButton).toHaveAttribute("aria-label", "Dismiss test-id");
    expect(dismissButton).toHaveAttribute("type", "button");
  });

  it("calls useDismissibleItem with correct id", () => {
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: null,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id">
        <div>Test content</div>
      </Dismissible>,
    );

    expect(mockUseDismissibleItem).toHaveBeenCalledWith("test-id", {
      enableCache: undefined,
      cachePrefix: undefined,
      cacheExpiration: undefined,
    });
  });

  it("renders custom LoadingComponent when provided", () => {
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: true,
      error: null,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    const CustomLoadingComponent = ({ itemId }: { itemId: string }) => (
      <div>Custom loading for {itemId}</div>
    );

    render(
      <Dismissible itemId="test-id" LoadingComponent={CustomLoadingComponent}>
        <div>Test content</div>
      </Dismissible>,
    );

    expect(screen.getByText("Custom loading for test-id")).toBeInTheDocument();
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
  });

  it("does not render error when ErrorComponent is null", () => {
    const mockError = new Error("Test error");
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: mockError,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id" ErrorComponent={null}>
        <div>Test content</div>
      </Dismissible>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(
      screen.queryByText("Unable to load content. Please try again later."),
    ).not.toBeInTheDocument();
  });

  it("does not render dismiss button when DismissButtonComponent is null", () => {
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: null,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id" DismissButtonComponent={null}>
        <div>Test content</div>
      </Dismissible>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows error component when error occurs and ignoreErrors is false", () => {
    const mockError = new Error("Test error");
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: mockError,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id" ignoreErrors={false}>
        <div>Test content</div>
      </Dismissible>,
    );

    expect(
      screen.getByText("Unable to load content. Please try again later."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
  });

  it("shows content when error occurs and ignoreErrors is true", () => {
    const mockError = new Error("Test error");
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: mockError,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id" ignoreErrors={true}>
        <div>Test content</div>
      </Dismissible>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(
      screen.queryByText("Unable to load content. Please try again later."),
    ).not.toBeInTheDocument();
  });

  it("still shows content when ignoreErrors is true and ErrorComponent is null", () => {
    const mockError = new Error("Test error");
    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: mockError,
      dismiss: mockDismiss,
      restore: mockRestore,
      item: undefined,
    });

    render(
      <Dismissible itemId="test-id" ignoreErrors={true} ErrorComponent={null}>
        <div>Test content</div>
      </Dismissible>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("resets isDismissing state when id changes", async () => {
    const mockAsyncDismiss = vi
      .fn()
      .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    mockUseDismissibleItem.mockReturnValue({
      dismissedAt: null,
      isLoading: false,
      error: null,
      dismiss: mockAsyncDismiss,
      restore: mockRestore,
      item: undefined,
    });

    const { rerender } = render(
      <Dismissible itemId="test-id-1">
        <div>Test content</div>
      </Dismissible>,
    );

    const dismissButton = screen.getByRole("button");
    fireEvent.click(dismissButton);

    rerender(
      <Dismissible itemId="test-id-2">
        <div>Test content</div>
      </Dismissible>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
