# Feature Specification: `@stackra/actions` wave 3, the action kinds and the fixed pipeline

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/actions` (application, wave 3) for real: the six kind bases, the pipeline that runs every
action and query, the stores and step ports it needs, `RequestContext`, `RateLimitConfig`, and the testing helpers the
template's tests import.

## Impact

- **Apps touched**: none (the console imports `ConflictResolution` from `.`; `.` stays free of `node:` imports)
- **Services touched**: none (the template's services import the kinds, contexts and `RateLimitConfig` from `.`)
- **Packages touched**: `packages/application/actions` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables. Idempotency keys and rate-limit buckets are scoped by tenant and principal; the
  tenant check is the `TenancyCheck` port the tenant-owning package implements (final review R-59: no tenant rule here)
- **Secrets**: none
- **ADR needed**: no (ADR 0098, 0101, 0136, 0138 as amended, 0217, 0252, 0265 as amended, 0294, 0305)
- **New dependencies**: none new; `@stackra/{contracts,container,config,errors,events,validation}` through
  `workspace:*`, `zod` through `catalog:`
- **Deploy modes**: same in all; the memory drivers make no outbound call (air-gapped safe)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/application/actions/README.md`, `packages/application/actions/AGENTS.md`; ADR 0098, 0101, 0120, 0136, 0138, 0217, 0252, 0265, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (permission fails closed; idempotency and rate limits protect writes)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: `Action`, `Query`, `Precondition`, `ExtensionPoint`,
  `Extension`, `Interceptor`; the fixed pipeline of ADR 0138 as amended; surfaces `endpoint`, `tool`, `job`, `intent`
  (ADR 0305 rule 28); the idempotency store behind a port (owner 2026-10-21); depends on events, errors, config;
  entries `.` and `./testing`, plus `./contracts` for the ports and `./node` for the one `node:` import, both inside the
  standard set of ADR 0294 decision 15

## User Scenarios & Testing

### User Story 1 - Declare and run an action (Priority: P1)

A module declares `class CreateOrderAction extends Action({ key, actors, preconditions, idempotency, rateLimit, tool,
intent, offline })` with `handle(input, ctx)`. The runtime runs it with `ActionPipeline.execute`, and a test runs it
with `run(CreateOrderAction, input, { as, idempotencyKey })`.

**Independent Test**: `src/core/services/__tests__/action-pipeline.service.test.ts`,
`src/testing/functions/__tests__/run.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** every step bound, **When** an action runs, **Then** the steps run as tenancy, permission, precondition,
   entitlement, flag, idempotency, rate limit, interceptors, `handle` in the unit of work, then `afterCommit` work.
2. **Given** an actor kind the action does not list, **When** it calls, **Then** it is refused `forbidden` before
   the permission step; **Given** no `AccessControl` bound, **Then** the call is an error (fail closed).
3. **Given** `Idempotency.Required`, **When** no key is sent, **Then** `idempotency_key_required`; a repeated key with
   the same input replays the first output without running `handle`; a different input is `idempotency_key_reused`;
   a refused call releases its key.
4. **Given** `rateLimit` or an area bucket in `RateLimitConfig`, **When** the bucket is empty, **Then**
   `rate_limited`.
5. **Given** a registered input schema, **When** the input breaks it, **Then** `input_invalid` with `fieldErrors`.

### User Story 2 - Publish and extend a seam (Priority: P1)

A module declares `OrderExtensionPoint` with `after` and `before` slots and calls them; another module implements one
slot with `Extension<OrderExtensionPoint["adjustTotals"]>({ order })`.

**Independent Test**: `src/core/functions/__tests__/create-slot.function.test.ts`,
`src/core/bases/__tests__/extension.base.test.ts`.

**Acceptance Scenarios**:

1. **Given** registered and inline extensions, **When** the owner calls an `after` slot, **Then** they run in ascending
   `order` as a value pipeline; a class the app does not bind is skipped.
2. **Given** a `before` slot, **When** an extension throws, **Then** the owner's call rejects with it; returned
   arguments replace the arguments.

### User Story 3 - Test without the pipeline (Priority: P2)

A unit test hands `fakeActionContext({ actor })` to a service and `fakeExtensionContext()` to an extension's `handle`,
and adds inline extensions with `.withExtensions([extension(Point, "slot", { order }, fn)])`.

**Independent Test**: `src/testing/**/__tests__/*.test.ts`.

## Requirements

- **FR-001**: Member files and entries `.`, `./contracts`, `./node`, `./testing`, each with a stand-in barrel.
- **FR-002**: `Action` and `Query` called-only kinds recording checked options with defaults; `Precondition`,
  `ExtensionPoint`, `Interceptor` bare kinds; `Extension` in both forms typed from its slot (spike shape E3).
- **FR-003**: The enums `Idempotency`, `OfflineMode`, `IdMinting`, `OfflinePrecondition`, `ConflictResolution`,
  `PipelineStage`.
- **FR-004**: `ActionPipeline` with the fixed order, fail-closed permission, optional steps, the unit of work,
  `afterCommit`, audit, idempotency, rate limits, interceptors and the call context (`ActionContext`, `QueryContext`,
  `ExtensionContext`, `PreconditionContext`).
- **FR-005**: The ports `AccessControl`, `TenancyCheck`, `EntitlementCheck`, `FlagCheck`, `IdempotencyStore`,
  `RateLimitStore`, `UnitOfWork`, `WorkflowRunner`, `JobDispatcher`, `AuditTrail`, `ContextStorage`; memory drivers for
  the two stores; the `AsyncLocalStorage` driver in `./node`; `RequestContext`.
- **FR-006**: `RateLimitConfig` (key `actions.rate_limit`) with its shipped `RateLimitConfig$`.
- **FR-007**: `registerActions`, `registerExtensions`, `connectExtensions`, and the `ExtensionTable` type of gen's
  printed chain.
- **FR-008**: `./testing`: `run`, `fakeActionContext`, `fakeExtensionContext`, `extension`, and the plugin adding
  `.withExtensions`.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/actions` and `@stackra/actions/testing` exists with the
  shape it uses: `.` Action, ActionContext(t), ConflictResolution, Extension, ExtensionContext(t), ExtensionPoint,
  ExtensionTable(t), IdMinting, Idempotency, OfflineMode, OfflinePrecondition, Precondition, PreconditionContext(t),
  Query, QueryContext(t), RateLimitConfig, RateLimitConfig$, RequestContext; `./testing` extension,
  fakeActionContext, fakeExtensionContext, run.
- **SC-002**: Every public symbol has a test beside it; the barrel tests pin each entry's exports.
- **SC-003**: Lint and format pass on the member (tests, typecheck and build run in the separate testing workflow).

## Out of scope (named, not built)

- The query `cache` runtime (serving and invalidating cached results): the option is typed and checked; serving needs
  `@stackra/cache` wiring and the live-query channel (owner R-25), and `CacheScope` waits for the R-59 call.
- `Controller` (A13): not assigned to this package by the owner.
- A durable `IdempotencyStore` driver (through `@stackra/database`) and a shared `RateLimitStore` driver.
- Implicit `before` and `after` points of every action (ADR 0305 rule 26): they need gen's per-action point.
- `Retry-After` details on `rate_limited`: the core `RateLimitedError` declares no field.

## Gen needs (for the gen-core row)

- A binding row for each `ExtensionPoint` subclass (no dependencies), since owners inject their point.
- `registerActions` rows (key, permission, risk, input class) and `registerExtensions` rows (point, slot, class,
  order) in the generated entries; a `RequestContext` binding over `ContextStorage`.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
