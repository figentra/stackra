# Plan: tenant from the platform-written scope

**Spec**: `.agents/specs/sta-1823-tenant-from-scope/spec.md`

This Mac runs only oxfmt and oxlint; tests run on CI boxes.

## Design

- `CallIsolationDriver` takes the `ScopeTree`. `tenantFor(actor, scope)` resolves the tenant before the isolation
  transaction: for a single scope it reads the tree in a scope session over the path's root label (the tree's row
  security shows a session only its own subtree, so a branch's tenant ancestor is invisible from the branch itself; the
  read touches `scope_nodes` only and the call's own `withScope` follows and replaces the session).
- Rules: job or system actor plus single scope: scope's tenant (unknown node or path mismatch refuses, a scope above all
  tenants keeps the actor's own id). Other actors: own `scopeId` wins, a known different scope tenant refuses.
- `TenantIsolationService.withTenant` is unchanged; the driver passes it the actor carrying the resolved tenant.
- Queue: `QueueService` asserts the shape of `options.scope`; the worker's `inScope` becomes a refusal for a scoped job
  without `CallIsolation`. Refusal, not a second tenant rule, so tenancy logic stays in tenancy.
- `asTenant` passes an empty memory tree and runs a platform call as a staff user, so a platform call with a scope
  option does not need a tree.

## Properties

- **P-001** Validates: FR-001, FR-002: the resolution rules (unit tests with a fake tree) and real rows (integration).
- **P-002** Validates: FR-003: client-shaped scopes are refused at push.
- **P-003** Validates: FR-004: a scoped job without `CallIsolation` is dead-lettered.
- **P-004** Validates: FR-005: the pipeline hands isolation the verified actor only.
- **P-005** Validates: FR-006: the note exists and the decision text is unchanged.

## Constitution Check

| Law                       | Result | Note                                                                         |
| ------------------------- | ------ | ---------------------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | tenancy already depends on scope; queue gains no dependency                  |
| Tenancy                   | PASS   | tenant derived from platform-written scope, never request input; users bound |
| Secrets                   | N/A    | none involved                                                                |
| Not built yet (ADR 0227)  | PASS   | no new technology                                                            |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside each subject                                             |
| Versions and catalogs     | PASS   | no dependency change                                                         |

## Deploy modes

| Mode       | Result | Note           |
| ---------- | ------ | -------------- |
| saas       | PASS   | same code      |
| on-prem    | PASS   | same code      |
| air-gapped | PASS   | no network use |
