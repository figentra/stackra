# Feature Specification: resolve `app.tenant_id` from the platform-written scope for system and job calls

**Feature Branch**: `figentra/sta-1823-tenant-from-scope`

**Created**: 2026-11-01

**Status**: Planned

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1823

**Clarifications status**: complete

**Input**: Row-level security reads `app.tenant_id`, which `TenantIsolationService.withTenant` sets from
`actor.scopeId ?? ''`. Three gaps follow. (1) `queue.push(X, input, { scope })` with no `origin` runs as a job actor with
no `scopeId`, so the tenant is `''` and a tenant-owned table returns zero rows (callers: segments, webhooks,
data-maintenance, the worker's dead-letter hook). (2) A stored schedule in a branch scope carries the scheduler's system
actor with the branch id as `scopeId`, so the tenant is the branch id, which matches no tenant row. (3) The queue
worker's legacy path (no `CallIsolation` bound) runs `Database.withScope` only and sets no tenant. The owner approved
deriving the tenant from the platform-written scope with the guards below (2026-11-01).

## Impact _(mandatory)_

- **Apps touched**: `apps/docs` (a dated note on ADR 0495)
- **Services touched**: none
- **Packages touched**: `@stackra/tenancy` (the driver, two refusals, the testing helper), `@stackra/queue` (the push
  guard, the worker's legacy path, two refusals), `@stackra/actions` (a test only)
- **Cross-service events**: none
- **Tenancy and data**: YES. This is tenant isolation itself: it changes which tenant `app.tenant_id` carries for
  system and job calls; no table, no migration
- **Secrets**: none
- **ADR needed**: no new ADR; a dated note on ADR 0495 records the reversal of decision 2's fail-closed rule for
  platform-written scopes
- **New dependencies**: none (`@stackra/scope` is already a dependency of tenancy; queue takes no new one)
- **Deploy modes**: all (SaaS, on-prem, air-gapped), no change
- **Licence tier**: free
- **Docs to update**: ADR 0495 note; READMEs of `@stackra/tenancy` and `@stackra/queue`; the tenancy package manifest
  and the queue manifest (error codes)
- **Lane**: full
- **Change risk**: R3 (tenant isolation, security)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A scoped job sees its tenant's rows (Priority: P1)

**Acceptance Scenarios**:

1. **Given** rows of tenants A and B and a scope tree with tenant A and a branch under A, **When** a job is pushed with
   `{ scope: A }` or `{ scope: branch }` and no origin, **Then** it sees only A's rows.
2. **Given** a schedule stored in the branch scope, **When** it fires, **Then** it sees only A's rows.
3. **Given** a user actor of tenant A calling in scope A, **When** the pipeline runs a query, **Then** it sees only A's rows.

### User Story 2 - Every guard fails closed (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a scope that is not a platform `ScopeRef`, **When** it is pushed, **Then** the push is refused.
2. **Given** a user of tenant A and a scope of tenant B, **When** the call runs, **Then** it is refused
   (`tenant_scope_mismatch`); neither tenant is picked.
3. **Given** a system or job call whose scope the tree does not know, **When** it runs, **Then** it is refused
   (`tenant_scope_unresolved`), never run with an empty tenant.
4. **Given** a scoped job and no `CallIsolation` bound, **When** the worker runs it, **Then** it is refused
   (`job_isolation_missing`).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `CallIsolationDriver.run`, for a `job` or `system` actor and a single scope, shall use the tenant of the
  scope (`tenantOf` over the `ScopeTree`; a branch resolves to its parent tenant) as `app.tenant_id`, whatever
  `actor.scopeId` says. A scope the tree does not show, or whose stored path is not the ref's path, is refused with
  `TenantScopeUnresolvedError`; a scope above every tenant keeps the actor's own `scopeId`.
- **FR-002**: For any other actor kind the actor's own `scopeId` always wins; when it and the scope's tenant are both
  known and differ, the driver shall refuse with `TenantScopeMismatchError` (`tenant_scope_mismatch`).
- **FR-003**: `QueueService.push`, `chain` and `batch` shall refuse a `scope` that is not a platform `ScopeRef` (exactly
  `{ id: scp_…, path: ltree }`) with `ScopeNotPlatformWrittenError`.
- **FR-004**: `QueueWorkerService` shall refuse a scoped job when no `CallIsolation` is bound
  (`JobIsolationMissingError`, dead-lettered at once) instead of running it with no tenant.
- **FR-005**: A test at the core boundary that hands the pipeline its actor shall prove the isolation's actor is the one
  the transport verified and nothing in the input, scope or idempotency key changes it.
- **FR-006**: ADR 0495 gets a dated note, decision text untouched.

## Success Criteria _(mandatory)_

- **SC-001**: the unit and integration tests of the plan pass in CI (not run on the author's Mac).
- **SC-002**: `pnpm verify` is green.

## Status history

- 2026-11-01 → Clarified: owner approval of the design and guards
- 2026-11-01 → Planned: `plan.md` written, plan gate passed
