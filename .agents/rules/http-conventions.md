---
title: HTTP conventions
description: One endpoint per operation, authenticated by default, verbs by idempotency, cursor lists, prefixed ids, idempotency keys.
always: false
applies_to: ["services/**", "packages/**/api-client/**", "**/api.ts", "**/events.ts"]
manual: false
---

# HTTP conventions

Apply to any service. No HTTP service exists yet and the backend runtime is undecided; Encore's `api()` is the
reference shape only if/when Encore is chosen (`/adr/0010-services-are-independent-workspace-members`).

- One endpoint per operation, typed request and response, no `any`, no `Record<string, unknown>` at a boundary.
- Authenticated by default. An unauthenticated exposed endpoint (health, webhook with signature verification,
  public content) carries a comment saying why.
- Verbs follow idempotency: `POST` creates; `PUT` idempotent state transition (`/archive`); `PATCH` partial update;
  `DELETE` only where a row is truly removed (archive instead).
- Lists are cursor-paginated (`cursor`, `limit` at most 100); sort and filter by explicit allow-list, never by
  passing column names through.
- Public ids are prefixed (`tea_01JQ...`); the handler rejects a wrong prefix before any query. Internal UUIDs never
  appear in URLs or responses (`/adr/0015-contract-packages`).
- Errors are typed (`invalidArgument`, `notFound`, `permissionDenied`, `failedPrecondition`) with stable messages,
  never a bare `Error`. A cross-tenant miss is `notFound`.
- Writes carry an `Idempotency-Key` header, deduped 24 hours per tenant. Financial writes use their own durable
  idempotency table, one transaction, and an audit event.
- Cross-service communication is a versioned event unless the caller needs an authoritative answer now.
- The API client is generated and never hand-edited.

Enforcement: planned (typed-boundary lint, generated-client drift check); until then, reviewer-checked.
Docs: `apps/docs/src/constitution/http-and-events.mdx`.
