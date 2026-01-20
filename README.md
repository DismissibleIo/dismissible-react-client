<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="240" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@dismissible/react-client" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/react-client.svg" alt="NPM Version" /></a>
    <a href="https://github.com/dismissibleio/dismissible-react-client/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/dismissibleio/dismissible-react-client" alt="Package License" /></a>
    <a href="https://www.npmjs.com/package/@dismissible/react-client" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/react-client.svg" alt="NPM Downloads" /></a>
    <a href="https://github.com/dismissibleio/dismissible-react-client" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-react-client/publish.yml" /></a>
    <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" /></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! 

# @dismissible/react-client

This is a React component library for creating dismissible UI elements with persistent state.

```tsx
import { DismissibleProvider, Dismissible } from '@dismissible/react-client';

function WelcomeBanner({ userId }: { userId: string }) {
  return (
    <DismissibleProvider userId={userId} baseUrl="http://localhost:3001">
      <Dismissible itemId="welcome-banner">
        <div className="banner">
          <h2>Welcome to our app!</h2>
          <p>This banner can be dismissed and won't show again.</p>
        </div>
      </Dismissible>
    </DismissibleProvider>
  );
}
```

This component is used with the [Dismissible API Server](https://github.com/DismissibleIo/dismissible-api), which you can self-host with Docker or integrate into an existing NestJS application.

**[dismissible.io](https://dismissible.io)** | **[Documentation](https://dismissible.io/docs)** | **[API Server](https://github.com/DismissibleIo/dismissible-api)**

## Features

- **Persistent state** - Dismissal state is saved and restored across sessions when using the [Dismissible API Server](https://github.com/DismissibleIo/dismissible-api)
- **Automatic request batching** - Multiple items requested in the same render cycle are automatically coalesced into a single API call
- **JWT Authentication** - Built-in support for secure JWT-based authentication
- **Custom HTTP Client** - Bring your own HTTP client (axios, ky, etc.) with custom headers, interceptors, and tracking
- **Customizable** - Custom loading, error, and dismiss button components
- **Accessible** - Built with accessibility best practices
- **Hook-based** - Includes `useDismissibleItem` hook for custom implementations
- **Lightweight** - Minimal bundle size with tree-shaking support
- **TypeScript** - Full TypeScript support with complete type definitions

## Installation

```bash
npm install @dismissible/react-client
```

### Peer Dependencies

Make sure you have React 18+ installed:

```bash
npm install react react-dom
```

## Quick Start

### 1. Set up the Dismissible API Server

First, you need a [Dismissible API Server](https://github.com/DismissibleIo/dismissible-api). The easiest way is with Docker:


```bash
docker run -p 3001:3001 -e DISMISSIBLE_PORT=3001 dismissibleio/dismissible-api:latest
```

See the [API Server documentation](https://github.com/DismissibleIo/dismissible-api) for more deployment options including NestJS integration, public Docker image and more.

### 2. Configure the Provider

Wrap your app with `DismissibleProvider`. The `userId` prop is **required** to track all your dismissals per user:

```tsx
import { DismissibleProvider } from '@dismissible/react-client';

function App() {
  const userId = getCurrentUserId();
  
  return (
    <DismissibleProvider userId={userId} baseUrl="http://localhost:3001">
      <YourApp />
    </DismissibleProvider>
  );
}
```

### 3. Use Dismissible Components
Now wrap any component you want to be dismissible with the `<Dismissible>` component, and the `itemId`, along with the `userId`, will become the unique key that is tracked across sessions and devices.

```tsx
import { Dismissible } from '@dismissible/react-client';

function WelcomeBanner() {
  return (
    <Dismissible itemId="welcome-banner">
      <div className="banner">
        <h2>Welcome to our app!</h2>
        <p>This banner can be dismissed and won't show again.</p>
      </div>
    </Dismissible>
  );
}
```

## API Reference

### `<DismissibleProvider>` Component

Context provider that configures authentication and API settings. **Required** - all `<Dismissible>` components must be wrapped in a provider.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | ✅ | User ID for tracking dismissals per user |
| `baseUrl` | `string` | ✅ | API base URL for your self-hosted server |
| `jwt` | `string \| (() => string) \| (() => Promise<string>)` | ❌ | JWT token for secure authentication |
| `client` | `DismissibleClient` | ❌ | Custom HTTP client implementation (uses default if not provided) |
| `children` | `ReactNode` | ✅ | Components that will use the dismissible functionality |

#### Example

```tsx
import { DismissibleProvider } from '@dismissible/react-client';

// Basic setup with userId
function App() {
  return (
    <DismissibleProvider userId="user-123" baseUrl="http://localhost:3001">
      <YourApp />
    </DismissibleProvider>
  );
}

// With static JWT
function AppWithJWT() {
  return (
    <DismissibleProvider 
      userId="user-123" 
      jwt="eyJhbGciOiJIUzI1NiIs..."
      baseUrl="https://api.yourapp.com"
    >
      <YourApp />
    </DismissibleProvider>
  );
}

// With dynamic JWT function
function AppWithDynamicAuth() {
  const { user, getAccessToken } = useAuth();
  
  return (
    <DismissibleProvider 
      userId={user.id} 
      jwt={() => getAccessToken()}
      baseUrl="https://api.yourapp.com"
    >
      <YourApp />
    </DismissibleProvider>
  );
}

// With async JWT function
function AppWithAsyncAuth() {
  const { user, refreshAndGetToken } = useAuth();
  
  return (
    <DismissibleProvider 
      userId={user.id} 
      jwt={async () => await refreshAndGetToken()}
      baseUrl="https://api.yourapp.com"
    >
      <YourApp />
    </DismissibleProvider>
  );
}
```

See [Custom HTTP Client](#custom-http-client) for examples of using a custom client.

### `<Dismissible>` Component

The main component for creating dismissible content.

> **Note:** The `<Dismissible>` component renders `null` when an item is dismissed. For restore functionality, use the `useDismissibleItem` hook directly in custom implementations.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `itemId` | `string` | ✅ | Unique identifier for the dismissible item |
| `children` | `ReactNode` | ✅ | Content to render when not dismissed |
| `onDismiss` | `() => void` | ❌ | Callback fired when item is dismissed |
| `LoadingComponent` | `ComponentType<{itemId: string}>` | ❌ | Custom loading component |
| `ErrorComponent` | `ComponentType<{itemId: string, error: Error}>` | ❌ | Custom error component |
| `DismissButtonComponent` | `ComponentType<{onDismiss: () => Promise<void>, ariaLabel: string}>` | ❌ | Custom dismiss button |
| `ignoreErrors` | `boolean` | ❌ | Ignore errors and display component anyway (default: false) |
| `enableCache` | `boolean` | ❌ | Enable localStorage caching (default: true) |
| `cachePrefix` | `string` | ❌ | Cache key prefix (default: 'dismissible') |
| `cacheExpiration` | `number` | ❌ | Cache expiration time in milliseconds |

#### Example

```tsx
<Dismissible
  itemId="promo-banner"
  onDismiss={() => console.log('Banner dismissed')}
>
  <div className="promo">
    <h3>Special Offer!</h3>
    <p>Get 50% off your first order</p>
  </div>
</Dismissible>
```

### `useDismissibleItem` Hook

For custom implementations and advanced use cases.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `itemId` | `string` | ✅ | Unique identifier for the dismissible item |
| `options` | `object` | ❌ | Configuration options |

#### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `enableCache` | `boolean` | ❌ | Enable localStorage caching (default: true) |
| `cachePrefix` | `string` | ❌ | Cache key prefix (default: 'dismissible') |
| `cacheExpiration` | `number` | ❌ | Cache expiration time in milliseconds |
| `initialData` | `IDismissibleItem` | ❌ | Initial data for the dismissible item |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `dismissedAt` | `string \| undefined` | ISO date string when item was dismissed, or undefined |
| `dismiss` | `() => Promise<void>` | Function to dismiss the item |
| `restore` | `() => Promise<void>` | Function to restore a dismissed item |
| `isLoading` | `boolean` | Loading state indicator |
| `error` | `Error \| undefined` | Error state, if any |
| `item` | `IDismissibleItem \| undefined` | The full dismissible item object |

#### Example

```tsx
import { useDismissibleItem } from '@dismissible/react-client';

function CustomDismissible({ itemId, children }) {
  const { dismissedAt, dismiss, restore, isLoading, error } = useDismissibleItem(itemId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (dismissedAt) {
    return (
      <div>
        <p>This item was dismissed.</p>
        <button onClick={restore}>Restore</button>
      </div>
    );
  }

  return (
    <div>
      {children}
      <button onClick={dismiss}>
        Dismiss
      </button>
    </div>
  );
}
```

## Usage Examples

### Basic Dismissible Banner

```tsx
import { DismissibleProvider, Dismissible } from '@dismissible/react-client';

function App() {
  const userId = getCurrentUserId();
  
  return (
    <DismissibleProvider userId={userId} baseUrl="http://localhost:3001">
      <Dashboard />
    </DismissibleProvider>
  );
}

function Dashboard() {
  return (
    <Dismissible itemId="welcome-banner">
      <div className="alert alert-info">
        <h4>Welcome!</h4>
        <p>Thanks for joining our platform. Here are some quick tips to get started.</p>
      </div>
    </Dismissible>
  );
}
```

### JWT Authentication Setup

For secure environments, configure JWT authentication:

```tsx
import { DismissibleProvider, Dismissible } from '@dismissible/react-client';

function App() {
  const { user, getAccessToken } = useAuth();
  
  return (
    <DismissibleProvider 
      userId={user.id}
      jwt={() => getAccessToken()}
      baseUrl="https://api.yourapp.com"
    >
      <Dashboard />
    </DismissibleProvider>
  );
}

function Dashboard() {
  return (
    <div>
      <Dismissible itemId="user-welcome-banner">
        <div className="alert alert-info">
          <h4>Welcome back!</h4>
          <p>You have 3 new notifications.</p>
        </div>
      </Dismissible>
    </div>
  );
}
```

### Custom Dismiss Button

```tsx
import { Dismissible } from '@dismissible/react-client';

const CustomDismissButton = ({ onDismiss, ariaLabel }) => (
  <button
    onClick={onDismiss}
    className="custom-close-btn"
    aria-label={ariaLabel}
  >
    ✕
  </button>
);

function CustomBanner() {
  return (
    <Dismissible
      itemId="custom-banner"
      DismissButtonComponent={CustomDismissButton}
    >
      <div className="banner">
        <p>This banner has a custom dismiss button!</p>
      </div>
    </Dismissible>
  );
}
```

### Custom Loading and Error Components

```tsx
import { Dismissible } from '@dismissible/react-client';

const CustomLoader = ({ itemId }) => (
  <div className="spinner">
    <div className="bounce1"></div>
    <div className="bounce2"></div>
    <div className="bounce3"></div>
  </div>
);

const CustomError = ({ error }) => (
  <div className="error-card">
    <h4>Oops! Something went wrong</h4>
    <p>{error.message}</p>
    <button onClick={() => window.location.reload()}>
      Try Again
    </button>
  </div>
);

function AdvancedBanner() {
  return (
    <Dismissible
      itemId="advanced-banner"
      LoadingComponent={CustomLoader}
      ErrorComponent={CustomError}
    >
      <div className="banner">
        <p>This banner has custom loading and error states!</p>
      </div>
    </Dismissible>
  );
}
```

### Multiple Dismissible Items

```tsx
import { Dismissible } from '@dismissible/react-client';

function Dashboard() {
  return (
    <div>
      <Dismissible itemId="feature-announcement">
        <div className="alert alert-success">
          New feature: Dark mode is now available!
        </div>
      </Dismissible>

      <Dismissible itemId="maintenance-notice">
        <div className="alert alert-warning">
          Scheduled maintenance: Sunday 2AM-4AM EST
        </div>
      </Dismissible>

      <Dismissible itemId="survey-request">
        <div className="alert alert-info">
          Help us improve! Take our 2-minute survey.
        </div>
      </Dismissible>
    </div>
  );
}
```

### Error Handling with ignoreErrors

```tsx
import { Dismissible } from '@dismissible/react-client';

// Show content even if API fails
function RobustBanner() {
  return (
    <Dismissible
      itemId="important-announcement"
      ignoreErrors={true}
    >
      <div className="important-banner">
        <h3>Critical System Update</h3>
        <p>System maintenance scheduled for tonight. Please save your work.</p>
      </div>
    </Dismissible>
  );
}
```

### Using the Hook for Complex Logic

```tsx
import { useDismissibleItem } from '@dismissible/react-client';
import { useState, useEffect } from 'react';

function SmartNotification({ itemId, message, type = 'info' }) {
  const { dismissedAt, dismiss, isLoading } = useDismissibleItem(itemId);
  const [autoHide, setAutoHide] = useState(false);

  // Auto-hide after 10 seconds for info messages
  useEffect(() => {
    if (type === 'info' && !dismissedAt) {
      const timer = setTimeout(() => {
        setAutoHide(true);
        dismiss();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [type, dismissedAt, dismiss]);

  if (dismissedAt || autoHide) {
    return null;
  }

  return (
    <div className={`notification notification-${type}`}>
      <span>{message}</span>
      <button 
        onClick={dismiss}
        disabled={isLoading}
        className="dismiss-btn"
      >
        {isLoading ? '...' : '×'}
      </button>
    </div>
  );
}
```

### Restoring Dismissed Items

Use the `restore` function to bring back previously dismissed content:

```tsx
import { useDismissibleItem } from '@dismissible/react-client';

function RestorableBanner({ itemId }) {
  const { dismissedAt, dismiss, restore, isLoading } = useDismissibleItem(itemId);

  if (dismissedAt) {
    return (
      <div className="dismissed-placeholder">
        <p>Banner was dismissed on {new Date(dismissedAt).toLocaleDateString()}</p>
        <button onClick={restore} disabled={isLoading}>
          {isLoading ? 'Restoring...' : 'Show Banner Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="banner">
      <h3>Welcome!</h3>
      <p>This is a restorable banner.</p>
      <button onClick={dismiss} disabled={isLoading}>
        Dismiss
      </button>
    </div>
  );
}
```

## Advanced Usage

### Automatic Request Batching

The library automatically batches multiple dismissible item requests into a single API call, dramatically reducing network overhead when rendering pages with many dismissible components.

#### How It Works

Under the hood, Dismissible uses a `BatchScheduler` that implements [DataLoader](https://github.com/graphql/dataloader)-style request coalescing:

1. **Request Collection**: When multiple `<Dismissible>` components or `useDismissibleItem` hooks mount during the same render cycle, each request is queued rather than fired immediately.

2. **Microtask Scheduling**: The scheduler uses `queueMicrotask()` to defer execution until after all synchronous code in the current JavaScript tick completes.

3. **Batch Execution**: All queued requests are combined into a single batch API call (up to 50 items per batch, with automatic splitting for larger sets).

4. **Result Distribution**: When the API responds, results are distributed back to each waiting component.


#### Example: Dashboard with Multiple Dismissibles

```tsx
// Without batching: 5 separate API calls
// With batching: 1 single API call containing all 5 item IDs

function Dashboard() {
  return (
    <div>
      <Dismissible itemId="welcome-banner">
        <WelcomeBanner />
      </Dismissible>
      
      <Dismissible itemId="feature-announcement">
        <FeatureAnnouncement />
      </Dismissible>
      
      <Dismissible itemId="survey-prompt">
        <SurveyPrompt />
      </Dismissible>
      
      <Dismissible itemId="upgrade-notice">
        <UpgradeNotice />
      </Dismissible>
      
      <Dismissible itemId="maintenance-alert">
        <MaintenanceAlert />
      </Dismissible>
    </div>
  );
}
```

#### Built-in Optimizations

The `BatchScheduler` includes several optimizations:

- **Request Deduplication**: If the same `itemId` is requested multiple times in the same tick, only one request is made and the result is shared.
- **In-Memory Caching**: Previously fetched items are cached in memory to avoid redundant API calls.
- **Cache Priming**: Items loaded from localStorage are automatically primed in the batch cache.
- **Cache Sync**: When items are dismissed or restored, the batch cache is updated to ensure consistency.

#### Using the Hook with Batching

The batching is completely transparent when using the `useDismissibleItem` hook:

```tsx
function NotificationCenter() {
  // All three hooks will batch their requests into a single API call
  const notification1 = useDismissibleItem('notification-1');
  const notification2 = useDismissibleItem('notification-2');
  const notification3 = useDismissibleItem('notification-3');

  // Rendering logic...
}
```

### Custom HTTP Client

By default, Dismissible uses a built-in HTTP client powered by `openapi-fetch`. However, you can provide your own HTTP client implementation by passing a `client` prop to the `DismissibleProvider`. This is useful when you need:

- Custom headers (correlation IDs, tracing, etc.)
- Request/response interceptors
- Use a different HTTP library (axios, ky, etc.)
- Analytics and logging
- Custom error handling

#### The DismissibleClient Interface

Your custom client must implement the `DismissibleClient` interface:

```typescript
import type { DismissibleClient, DismissibleItem } from '@dismissible/react-client';

interface DismissibleClient {
  getOrCreate: (params: {
    userId: string;
    itemId: string;
    baseUrl: string;
    authHeaders: { Authorization?: string };
    signal?: AbortSignal;
  }) => Promise<DismissibleItem>;

  // Required for automatic batching - fetches multiple items in one API call
  batchGetOrCreate: (params: {
    userId: string;
    itemIds: string[];  // Array of item IDs (max 50)
    baseUrl: string;
    authHeaders: { Authorization?: string };
    signal?: AbortSignal;
  }) => Promise<DismissibleItem[]>;

  dismiss: (params: {
    userId: string;
    itemId: string;
    baseUrl: string;
    authHeaders: { Authorization?: string };
  }) => Promise<DismissibleItem>;

  restore: (params: {
    userId: string;
    itemId: string;
    baseUrl: string;
    authHeaders: { Authorization?: string };
  }) => Promise<DismissibleItem>;
}
```

#### Example: Custom Client with Axios

```tsx
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { DismissibleProvider } from '@dismissible/react-client';
import type { DismissibleClient } from '@dismissible/react-client';

const axiosClient: DismissibleClient = {
  getOrCreate: async ({ userId, itemId, baseUrl, authHeaders, signal }) => {
    const response = await axios.get(
      `${baseUrl}/v1/users/${userId}/items/${itemId}`,
      {
        headers: {
          ...authHeaders,
          'X-Correlation-ID': uuid(),
        },
        signal,
      }
    );
    return response.data.data;
  },

  // Batch endpoint for automatic request coalescing
  batchGetOrCreate: async ({ userId, itemIds, baseUrl, authHeaders, signal }) => {
    const response = await axios.post(
      `${baseUrl}/v1/users/${userId}/items/batch`,
      { itemIds },
      {
        headers: {
          ...authHeaders,
          'X-Correlation-ID': uuid(),
        },
        signal,
      }
    );
    return response.data.data;
  },

  dismiss: async ({ userId, itemId, baseUrl, authHeaders }) => {
    const response = await axios.delete(
      `${baseUrl}/v1/users/${userId}/items/${itemId}`,
      {
        headers: {
          ...authHeaders,
          'X-Correlation-ID': uuid(),
        },
      }
    );
    return response.data.data;
  },

  restore: async ({ userId, itemId, baseUrl, authHeaders }) => {
    const response = await axios.post(
      `${baseUrl}/v1/users/${userId}/items/${itemId}`,
      {},
      {
        headers: {
          ...authHeaders,
          'X-Correlation-ID': uuid(),
        },
      }
    );
    return response.data.data;
  },
};

function App() {
  return (
    <DismissibleProvider
      userId="user-123"
      baseUrl="https://api.yourapp.com"
      client={axiosClient}
    >
      <YourApp />
    </DismissibleProvider>
  );
}
```

## Styling

The library includes minimal default styles. You can override them or provide your own:

```css
/* Default classes you can style */
.dismissible-container {
  /* Container for the dismissible content */
}

.dismissible-loading {
  /* Loading state */
}

.dismissible-error {
  /* Error state */
}

.dismissible-button {
  /* Default dismiss button */
}
```

## Support

- [Documentation](https://dismissible.io/docs)
- [GitHub - React Client](https://github.com/DismissibleIo/dismissible-react-client)
- [GitHub - API Server](https://github.com/DismissibleIo/dismissible-api)

## License

MIT © [Dismissible](https://dismissible.io)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed list of changes.
