---
title: Tenancy
description: Two-layer tenant isolation rules, plus the scope-tree rules (free code; depth by plan). Read when adding the first tenant-owned table or touching tenant-scoped code; not loaded by default.
always: false
globs: []
---

# Tenancy

On request only. Stackra has no database and no tenant-owned table; this binds from the first one, and the checks
must exist first. Reasoning: `apps/docs/src/docs/constitution/tenancy.mdx`.

1. **Application layer.** Every query on a tenant-owned table runs inside `withTenant(ctx, db => ...)` (or `withScope(ctx, db => ...)`
   when the scope tree is in use), which open a transaction and `set_config('app.tenant_id', $1, true)` from the
   authenticated principal, never from request input. A direct query in a handler is a lint failure.
2. **Database layer.** Every tenant-owned table has `tenant_id uuid NOT NULL`, `ENABLE ROW LEVEL SECURITY` and
   `FORCE ROW LEVEL SECURITY` (the owning role would otherwise bypass RLS), and a policy on
   `current_setting('app.tenant_id', true)`. A forgotten filter returns zero rows. Never hand-write the policy;
   generate it from the scoped-table pattern (`/adr/0014-data-ownership-and-orm`).
3. **Scope tree (free code; depth is a plan entitlement).** The scope tree is free code in `@stackra/iam` and
   `@stackra/tenancy`, with no `@stackra-pro` package (`/adr/0240-scope-tree-is-free-code-with-depth-by-plan`). Depth is a
   plan entitlement; numbers in 0242. When the tree is in use: nodes use `scope_id uuid PRIMARY KEY`; tables that belong to a node carry `scope_id` and a
   denormalised `scope_path ltree` with a GiST index. Use the OR-expansion `(scope_path <@ $1 OR scope_path <@ $2 ...)`;
   `<@ ANY(...)` seq-scans. Empty granted paths means `false`.
4. **Tenant context** is resolved once per request by the single auth handler. Never from body, query or client
   headers; when the scope tree is in use, the one client header read, `X-Scope-Path`, is validated against granted paths and dropped otherwise.
5. **Cross-tenant access** exists only in an audited, privileged endpoint named by an ADR. Backfill migrations use the
   policy's dedicated bypass clause, decided in the migration template.
6. **Tests.** Every service with tenant-owned tables ships `isolation.test.ts` proving tenant B gets zero rows or 404
   on tenant A's data for list/get/update/delete, and that a handler without `withTenant()` returns zero rows.

Enforcement: planned (scoped-table generator, handler lint, per-service isolation test); active from the first table.
