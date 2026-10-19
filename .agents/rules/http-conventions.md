---
title: HTTP Conventions
always: true
description: HTTP API conventions for Encore services
---

# HTTP Conventions

Stackra backend APIs follow Encore conventions with additional rules.

## Endpoints

Every Encore endpoint uses `api()` from `encore.dev/api`:

```typescript
import { api } from "encore.dev/api";

export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async ({ id }: { id: string }): Promise<User> => {
    // ...
  },
);
```

## Methods

HTTP methods **by idempotency**:

- `GET` - Safe, idempotent, no body
- `PUT` - Idempotent, replaces entire resource
- `DELETE` - Idempotent
- `POST` - Non-idempotent, creates resources
- `PATCH` - Non-idempotent, partial update

## Authentication

All endpoints authenticated by default:

```typescript
export const getUser = api(
  {
    method: "GET",
    path: "/users/:id",
    auth: true, // Default, can omit
  },
  async ({ id }, { auth }: { id: string }, authData) => {
    const userId = authData.userID;
    // ...
  },
);
```

Public endpoints must explicitly opt-out:

```typescript
export const health = api(
  { method: "GET", path: "/health", auth: false },
  async (): Promise<{ status: "ok" }> => ({ status: "ok" }),
);
```

## Request/Response

### Always typed

```typescript
interface GetUserRequest {
  id: string;
}

interface User {
  id: string;
  email: string;
  createdAt: string; // ISO 8601
}

export const getUser = api(
  { method: "GET", path: "/users/:id" },
  async (req: GetUserRequest): Promise<User> => {
    /* ... */
  },
);
```

### Cursor pagination

```typescript
interface ListUsersRequest {
  cursor?: string;
  limit?: number; // Default: 20, max: 100
}

interface ListUsersResponse {
  users: User[];
  nextCursor?: string;
  hasMore: boolean;
}
```

### Prefixed IDs

```typescript
// Use prefixed IDs externally
interface User {
  id: string; // "user_01H2J3K4L5M6N7P8Q9R0"
  email: string;
}

// Internal: never expose database IDs
```

## Idempotency

Non-GET operations support `Idempotency-Key`:

```typescript
export const createPayment = api(
  { method: "POST", path: "/payments" },
  async (req: CreatePaymentRequest, headers: { "idempotency-key"?: string }) => {
    const key = headers["idempotency-key"];
    // Use key for deduplication
  },
);
```

## Versioning

**Versioned events, not endpoints.**

- Endpoints are immutable (no `/v1`, `/v2`)
- Events are versioned (`user.created.v1`, `user.created.v2`)
- New endpoint → new path

## Error Handling

Use Encore's APIError:

```typescript
import { APIError } from "encore.dev/api";

if (!user) {
  throw APIError.notFound("user not found");
}

if (!authorized) {
  throw APIError.permissionDenied("cannot access this user");
}
```

## See Also

- Constitution: http-and-events
- ADR-0010: Services are independent members
- Standards: api-contracts
