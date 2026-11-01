# Feature Specification: every call and background unit runs in a transaction-local isolation context

**Feature Branch**: `figentra/sta-1699-call-isolation`

**Created**: 2026-10-31

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1699

**Clarifications status**: complete

**Input**: "Only `TenantIsolationService.withTenant` sets `app.tenant_id`, and only a few drivers call it. The action
pipeline, queries and the background units set at most `app.scope_*`. Make every call and every background unit run in
one transaction whose settings are transaction-local, and forbid session-level settings." Decision: ADR 0495.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `@stackra/actions`, `@stackra/tenancy`, `@stackra/database`, `@stackra/queue`, `@stackra/outbox`, `@stackra/workflow`, `@stackra/scheduler`, and `tools/scripts` (the guard)
- **Cross-service events**: none
- **Tenancy and data**: yes, it is the point; tenant and scope settings become transaction-local for every call and background unit; no table, no migration
- **Secrets**: none
- **ADR needed**: yes, ADR 0495 (amends 0239 and 0138)
- **New dependencies**: none
- **Deploy modes**: all (SaaS, on-prem, air-gapped)
- **Lane**: full
- **Change risk**: R4, tenant isolation
- **Licence tier**: free
- **Docs to update**: ADR 0495 and its index row; READMEs and AGENTS.md of the touched packages; `.agents/rules/tenancy.md`

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A call sees only its tenant's rows (Priority: P1)

**Acceptance Scenarios**:

1. **Given** tenant A and B rows, **When** A calls a query or an action, **Then** only A's rows are read or written.
2. **Given** a platform actor, **When** it calls, **Then** no tenant row is visible.
3. **Given** a finished call, **When** the pooled connection is read, **Then** `app.tenant_id` is empty or null.

### User Story 2 - Background units keep the stored actor (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a job, delivery, step or run with a stored actor, **When** it runs, **Then** it runs under that actor's tenant and scope.
2. **Given** none stored, **When** it runs, **Then** it runs as a platform call.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `@stackra/actions` shall declare a `CallIsolation` port, and the pipeline shall run every call after the tenancy check inside it (actions writable, queries read-only); with no driver bound the pipeline behaves as before.
- **FR-002**: `@stackra/tenancy` shall bind a driver that sets scope and tenant settings transaction-locally in one transaction.
- **FR-003**: The queue worker, outbox relay and inbox, workflow journal and scheduler shall run each unit through the port with the stored actor, falling back to `Database.withScope`.
- **FR-004**: `pnpm validate` shall refuse `set_config(` with a `false` third argument and `SET [LOCAL] app.` outside an explicit allowlist.
- **FR-005**: `@stackra/tenancy/testing` shall ship `asTenant(tenantId, work)`.
- **FR-006**: Real-Postgres tests shall prove isolation under a role without `BYPASSRLS`.

## Success Criteria _(mandatory)_

- **SC-001**: The real-Postgres tests of FR-006 pass in CI.
- **SC-002**: `pnpm verify` is green.

## Status history

- 2026-10-31 → Clarified: approved by the leader after the core trace
