---
title: HTTP Conventions
always: true
description: HTTP API conventions for Stackra services (authored as decorated actions; Encore is generated)
---

# HTTP Conventions

Services are plain TypeScript. You never write `encore.dev`, `api()` or `encore.service.ts` in a service: behaviour is
a decorated action (ADR 0094, 0098), and `stackra gen` emits the Encore `api()` adapters into the gitignored
`.stackra/encore/` (ADR 0091, 0124). The rules below are what the generated endpoints must satisfy, so they shape how
you author actions.

## Endpoints

An action exposes itself over HTTP with `@AsEndpoint`. `@Controller` is only for raw endpoints that are not actions
(webhook receivers, `/api/auth/*`, streaming). Shapes are illustrative; the authoritative decorator API is in the
package docs.

```typescript
@Action({ key: "user.get@1", input: GetUserInput, output: UserOutput, permission: "identity.user.read" })
@AsEndpoint({ method: "GET", path: "/users/:id" })
async getUser(input: GetUserInput): Promise<UserOutput> {
  // ...
}
```

## Methods

HTTP methods **by idempotency**:

- `GET` - Safe, idempotent, no body (`@Query`)
- `PUT` - Idempotent state transition (`/archive`, `/activate`), per the HTTP and events law
- `DELETE` - Idempotent
- `POST` - Non-idempotent, creates resources
- `PATCH` - Non-idempotent, partial update

## Authentication

Every endpoint is authenticated by default. A public endpoint opts out explicitly with `auth: false` on the action;
the flag applies to the action's API area (ADR 0082), and the gateway enforces it (ADR 0237):

```typescript
@Action({ key: "health.get@1", output: HealthOutput, auth: false })
@AsEndpoint({ method: "GET", path: "/health" })
```

The caller is the typed `Actor` the action pipeline provides (ADR 0098); never read a user id from the request body.

## Request/Response

### Always typed

Input and output are Zod schemas on the action (ADR 0095); the TypeScript types are inferred from them.

```typescript
const GetUserInput = z.object({ id: z.string() });
const UserOutput = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(), // ISO 8601
});
```

### Cursor pagination

```typescript
const ListUsersInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
const ListUsersOutput = z.object({
  users: z.array(UserOutput),
  nextCursor: z.string().optional(),
  hasMore: z.boolean(),
});
```

### Prefixed IDs

Use prefixed ids externally (`user_01H2J3K4L5M6N7P8Q9R0`); never expose database ids.

## Idempotency

Non-GET operations support the `Idempotency-Key` header. The action pipeline has an idempotency step (ADR 0098), so an
action declares that it is idempotent-keyed and the pipeline deduplicates; do not hand-roll key storage in a handler.

## Versioning

**Versioned events, not endpoints.**

- Endpoints are immutable (no `/v1`, `/v2`)
- Events are versioned and prefixed by module key: `<module-key>.<aggregate>.<verb>.v<n>` (`identity.user.created.v1`, `identity.user.created.v2`, ADR 0141)
- New endpoint → new path
- API versions are dates: the `Stackra-Version` header, pinned per API key or OAuth app, through the dormant `@stackra/versioning` package. Paths stay unversioned (`/adr/0118-api-versioning-dormant-package`)

## Error Handling

Throw a typed error from the action; the generated adapter maps it to the matching HTTP status (not found, permission
denied, invalid argument, and so on). The error envelope and its kinds follow ADR 0140. Never build HTTP responses by hand and never import `APIError` in a service.

## See Also

- Constitution: http-and-events
- ADR-0091, ADR-0124: Encore is generated into `.stackra/encore`
- ADR-0094, ADR-0098: decorators-only authoring, actions are the unit
- ADR-0010: Services are independent members
- ADR-0082 (API areas and auth), ADR-0237 (generated gateway), ADR-0140 (error envelope), ADR-0141 (event names)
- Standards: api-contracts
