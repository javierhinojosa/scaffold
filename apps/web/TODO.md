# Supabase Auth Improvements

## Session Management
- [x] ~~Implement server-side auth middleware~~ (Done in middleware.ts)
- [x] ~~Add data-logged-in attribute for client state~~ (Done in Layout.astro)
- [x] ~~Handle auth state changes in Layout~~ (Done in Layout.astro)
- [ ] Session Expiry Handling
  ```ts
  // Implementation plan:
  interface SessionConfig {
    warningThresholdMs: number;  // When to show warning
    refreshThresholdMs: number;  // When to attempt refresh
    maxRetries: number;          // Max refresh attempts
  }
  ```
  - [ ] Add session expiry warning component
  - [ ] Implement silent refresh with exponential backoff
  - [ ] Add session recovery mechanism

## Error Handling
- [x] ~~Basic error handling in getUser~~ (Done in supabaseServer.ts)
- [ ] Error Components
  ```ts
  // Implementation plan:
  interface ErrorBoundaryProps {
    fallback: (error: Error) => JSX.Element;
    children: JSX.Element;
  }
  ```
  - [ ] Create ErrorBoundary.astro component
  - [ ] Add Toast.svelte component for notifications
  - [ ] Create error message store

## Role-Based Access Control (RBAC)
- [x] ~~Basic protected routes in middleware~~ (Done in middleware.ts)
- [ ] Database Schema
  ```sql
  -- Implementation plan:
  CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'
  );

  CREATE TABLE user_roles (
    user_id UUID REFERENCES auth.users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
  );
  ```
  - [ ] Create migration for roles tables
  - [ ] Add RLS policies
  - [ ] Create role management API

## Security Enhancements
- [x] ~~Secure cookie settings~~ (Done in Layout.astro)
- [ ] CSRF Protection
  ```ts
  // Implementation plan:
  interface CsrfConfig {
    headerName: string;
    cookieName: string;
    ignorePaths: string[];
  }
  ```
  - [ ] Add CSRF middleware
  - [ ] Create token rotation mechanism
  - [ ] Add token validation

## UI Components
- [ ] Auth Components
  ```ts
  // Implementation plan:
  interface AuthProps {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    redirectTo?: string;
  }
  ```
  - [ ] Create SessionExpiryWarning.svelte
  - [ ] Add LoadingSpinner.svelte
  - [ ] Create ErrorToast.svelte

## Testing
- [ ] Unit Tests
  ```ts
  // Implementation plan:
  interface TestConfig {
    mockUser: User;
    mockSession: Session;
    mockRoles: Role[];
  }
  ```
  - [ ] Add auth flow tests
  - [ ] Create role management tests
  - [ ] Add session handling tests

## Documentation
- [ ] API Documentation
  ```md
  // Implementation plan:
  ## Auth API
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/logout
  ```
  - [ ] Document auth flows
  - [ ] Add security guidelines
  - [ ] Create troubleshooting guide
   