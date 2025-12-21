# @dismissible/react-client

A React component library for creating dismissible UI elements with persistent state management.

**Free and open source** - use with the [Dismissible API Server](https://github.com/DismissibleIo/dismissible-api) that you can self-host with Docker or integrate into your NestJS application.

🌐 **[dismissible.io](https://dismissible.io)** | 📖 **[Documentation](https://dismissible.io/docs)** | 🐙 **[API Server](https://github.com/DismissibleIo/dismissible-api)**

[![npm version](https://badge.fury.io/js/@dismissible%2Freact-client.svg)](https://badge.fury.io/js/@dismissible%2Freact-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Easy to use** - Simple component API for dismissible content
- 💾 **Persistent state** - Dismissal state is saved and restored across sessions
- 🔄 **Restore support** - Restore previously dismissed items programmatically
- 🔐 **JWT Authentication** - Built-in support for secure JWT-based authentication
- 🎨 **Customizable** - Custom loading, error, and dismiss button components
- ♿ **Accessible** - Built with accessibility best practices
- 🪝 **Hook-based** - Includes `useDismissibleItem` hook for custom implementations
- 📦 **Lightweight** - Minimal bundle size with tree-shaking support
- 🔧 **TypeScript** - Full TypeScript support with complete type definitions
- 🐳 **Self-hosted** - Works with your own Dismissible API server

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

First, you need a Dismissible API server running. The easiest way is with Docker:

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    image: dismissibleio/dismissible-api:latest
    ports:
      - '3001:3001'
    environment:
      DISMISSIBLE_PORT: 3001
      DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING: postgresql://postgres:postgres@db:5432/dismissible
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dismissible
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

See the [API Server documentation](https://github.com/DismissibleIo/dismissible-api) for more deployment options including NestJS integration.

### 2. Configure the Provider

Wrap your app with `DismissibleProvider`. The `userId` prop is **required** to track dismissals per user:

```tsx
import { DismissibleProvider } from '@dismissible/react-client';

function App() {
  const userId = getCurrentUserId(); // Get from your auth system
  
  return (
    <DismissibleProvider userId={userId} baseUrl="http://localhost:3001">
      <YourApp />
    </DismissibleProvider>
  );
}
```

### 3. Use Dismissible Components

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
| `jwt` | `string \| (() => string) \| (() => Promise<string>)` | ❌ | JWT token for secure authentication |
| `baseUrl` | `string` | ❌ | API base URL (defaults to your self-hosted server) |
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
| `dismissedOn` | `string \| null` | ISO date string when item was dismissed, or null |
| `dismiss` | `() => Promise<void>` | Function to dismiss the item |
| `restore` | `() => Promise<void>` | Function to restore a dismissed item |
| `isLoading` | `boolean` | Loading state indicator |
| `error` | `Error \| null` | Error state, if any |
| `item` | `IDismissibleItem \| undefined` | The full dismissible item object |

#### Example

```tsx
import { useDismissibleItem } from '@dismissible/react-client';

function CustomDismissible({ itemId, children }) {
  const { dismissedOn, dismiss, restore, isLoading, error } = useDismissibleItem(itemId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (dismissedOn) {
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
      {/* Dismissible state is tracked per user */}
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
          🎉 New feature: Dark mode is now available!
        </div>
      </Dismissible>

      <Dismissible itemId="maintenance-notice">
        <div className="alert alert-warning">
          ⚠️ Scheduled maintenance: Sunday 2AM-4AM EST
        </div>
      </Dismissible>

      <Dismissible itemId="survey-request">
        <div className="alert alert-info">
          📝 Help us improve! Take our 2-minute survey.
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

### Integration with Auth Providers

```tsx
import { DismissibleProvider } from '@dismissible/react-client';

// With Firebase Auth
function AppWithFirebase() {
  const user = firebase.auth().currentUser;
  
  return (
    <DismissibleProvider 
      userId={user.uid}
      jwt={async () => {
        if (user) {
          return await user.getIdToken();
        }
        throw new Error('User not authenticated');
      }}
      baseUrl="https://api.yourapp.com"
    >
      <YourApp />
    </DismissibleProvider>
  );
}

// With Auth0
function AppWithAuth0() {
  const { user, getAccessTokenSilently } = useAuth0();
  
  return (
    <DismissibleProvider 
      userId={user.sub}
      jwt={async () => await getAccessTokenSilently()}
      baseUrl="https://api.yourapp.com"
    >
      <YourApp />
    </DismissibleProvider>
  );
}

// With token refresh logic
function AppWithTokenRefresh() {
  const { user } = useAuth();
  
  return (
    <DismissibleProvider 
      userId={user.id}
      jwt={async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          const { accessToken } = await response.json();
          return accessToken;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          throw error;
        }
      }}
      baseUrl="https://api.yourapp.com"
    >
      <YourApp />
    </DismissibleProvider>
  );
}
```

### Using the Hook for Complex Logic

```tsx
import { useDismissibleItem } from '@dismissible/react-client';
import { useState, useEffect } from 'react';

function SmartNotification({ itemId, message, type = 'info' }) {
  const { dismissedOn, dismiss, isLoading } = useDismissibleItem(itemId);
  const [autoHide, setAutoHide] = useState(false);

  // Auto-hide after 10 seconds for info messages
  useEffect(() => {
    if (type === 'info' && !dismissedOn) {
      const timer = setTimeout(() => {
        setAutoHide(true);
        dismiss();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [type, dismissedOn, dismiss]);

  if (dismissedOn || autoHide) {
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
  const { dismissedOn, dismiss, restore, isLoading } = useDismissibleItem(itemId);

  if (dismissedOn) {
    return (
      <div className="dismissed-placeholder">
        <p>Banner was dismissed on {new Date(dismissedOn).toLocaleDateString()}</p>
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

### Admin Panel with Restore Capability

```tsx
import { useDismissibleItem } from '@dismissible/react-client';

function AdminNotificationManager({ notificationId }) {
  const { dismissedOn, dismiss, restore, item, isLoading, error } = 
    useDismissibleItem(notificationId);

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <div className="admin-panel">
      <h4>Notification: {notificationId}</h4>
      <p>Status: {dismissedOn ? 'Dismissed' : 'Active'}</p>
      {dismissedOn && (
        <p>Dismissed at: {new Date(dismissedOn).toLocaleString()}</p>
      )}
      
      <div className="actions">
        {dismissedOn ? (
          <button 
            onClick={restore} 
            disabled={isLoading}
            className="btn-restore"
          >
            Restore
          </button>
        ) : (
          <button 
            onClick={dismiss} 
            disabled={isLoading}
            className="btn-dismiss"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
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

## TypeScript Support

The library is written in TypeScript and exports all type definitions:

```tsx
import type {
  DismissibleProps,
  DismissibleProviderProps,
  JwtToken,
} from '@dismissible/react-client';

// Custom provider wrapper
const AuthenticatedDismissibleProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, getToken } = useAuth();
  
  return (
    <DismissibleProvider 
      userId={user.id} 
      jwt={getToken}
      baseUrl={process.env.DISMISSIBLE_API_URL}
    >
      {children}
    </DismissibleProvider>
  );
};
```

## Self-Hosting

Dismissible is designed to be self-hosted. You have full control over your data.

### Option 1: Docker (Recommended)

The fastest way to get started:

```bash
docker run -p 3001:3001 dismissibleio/dismissible-api:latest
```

See the [Docker documentation](https://dismissible.io/docs/docker) for production configuration.

### Option 2: NestJS Module

Integrate directly into your existing NestJS application:

```bash
npm install @dismissible/nestjs-api
```

See the [NestJS documentation](https://dismissible.io/docs/nestjs) for setup instructions.

## Support

- 📖 [Documentation](https://dismissible.io/docs)
- 🐙 [GitHub - React Client](https://github.com/DismissibleIo/dismissible-react-client)
- 🐙 [GitHub - API Server](https://github.com/DismissibleIo/dismissible-api)

## License

MIT © [Dismissible](https://dismissible.io)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed list of changes.
