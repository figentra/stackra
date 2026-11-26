# Feature Specification: an end-to-end example service (sign-in, tenancy, several surfaces, events and jobs)

**Feature Branch**: `figentra/sta-2856-example-service`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2856

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: The production-readiness audit of 26 Nov (item 18.3) found that no example shows sign-in, tenancy, several
surfaces, events and jobs together: core's `services/example` was a hello-world placeholder, and the starter's example
is a non-tenant notes module (create and list). Teams need one service whose patterns they can copy for real tasks,
each proven by a test. Building it showed that a generated service could not run a cron at all: the generated Encore
CronJobs resolve `SchedulerService`, which no generated wiring bound, and a per-tenant cron had no driver that lists
the tenants unless the host chose one.

### Sources

- FR-001 to FR-004, FR-007: `services/example` on `main` (the placeholder) and the starter's `services/example`
  (notes only), and the audit item 18.3 that names their gap
- FR-001: `origin/save/stackra/l3/service-example-diverged-2026-11-25` (the X11 notes resource, PR #1064, unmerged), whose two
  example commits this change carries onto `main`
- FR-005 and FR-006: `packages/developer/gen/src/core/functions/emit-encore-cron-jobs.function.ts` (the CronJobs that resolve
  `SchedulerService`), `packages/developer/gen/src/core/constants/boot-services.constant.ts` (what the wiring binds for
  what boot and the Encore files resolve), `packages/developer/gen/src/core/functions/system-driver-defaults.function.ts`
- FR-004 and FR-006: `packages/runtime/scheduler/README.md` (crons, `perScope`, `CronScopes`), `packages/security/tenancy/src/core/drivers/tenancy-cron-scopes.driver.ts`
- FR-008: `packages/data/database/src/core/bases/crud-service.base.ts` (`CrudService.table`, the keyset read through
  MikroORM's `findByCursor`, whose `CursorError` escaped as a server error) and ADR 0307 rule 2
- ADR 0075, 0078 (decisions 2 to 4), 0098, 0148 (decisions 4 to 6), 0206 (decision 8), 0209 (decision 3), 0239, 0263,
  0269, 0294, 0305 (rule 28)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: services/example (`@figentra/service-example`, private): the placeholder becomes a v3 member
  with the `notes` and `activity` modules
- **Packages touched**: packages/developer/gen (`BOOT_SERVICES`, `systemDriverDefaults`), packages/data/database
  (`CrudService.table`, a new `TableCursorInvalidError`)
- **Public contract change**: additive. The example's committed `stackra.manifest.json` and `openapi.json` gain the
  notes and activity operations, events, permissions and the cron job. Gen's generated wiring for a service that
  declares `@stackra/scheduler` gains a `SchedulerService` binding, and for one that declares `@stackra/scheduler` and
  `@stackra/tenancy` the `CronScopes` port gets `default: "tenancy"`. `@stackra/database` exports a new refusal,
  `TableCursorInvalidError` (`table_cursor_invalid`), which `CrudService.table` throws for a cursor no page gave
  instead of MikroORM's `CursorError`; nothing is removed or renamed. The root
  `runway.yaml` names the reference services' Encore app id (`providers.encore.app`), which gen needs for a v3 service.
- **Cross-service events**: none (the activity listeners take the same service's notes events)
- **Tenancy and data**: two tenant-owned tables, `notes.notes` and `activity.activity_entries`, each with a forced
  row-level policy from `t.belongsToTenant()`; the tenant always comes from the running call
- **Security and privacy**: every route needs a signed-in caller; a note's text never leaves its tenant or enters an event
  or a feed entry; the feed holds ids, kinds and times only and is deleted after 90 days
- **Secrets**: none (the issuer and audience are configuration; the Encore app id is public)
- **ADR needed**: no (implements ADR 0075's reference services, ADR 0078, ADR 0148 decisions 4 to 6 and ADR 0294 as
  written; ADR 0075 gains a dated note)
- **New dependencies**: none new to the repository; `@figentra/service-example` declares workspace packages it uses
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `services/example/README.md`, `services/example/AGENTS.md`, `services/README.md`,
  `packages/developer/gen/README.md`, `packages/data/database/README.md`, ADR 0075 (note), a patch changeset for
  `@stackra/gen` and a minor one for `@stackra/database`
- **Lane**: full (a reference service, a gen change to generated wiring)
- **Change risk**: R1 (gen adds bindings only for services that declare the scheduler; the example is private)

## Glossary _(full lane)_

- **Surface**: a way a caller reaches an operation: an HTTP route (signed-in user), an MCP tool (agent), a cron run
  through the queue (the system).
- **Per-tenant cron**: a job action whose `job.cron.perScope` is true: the scheduler pushes one job per scope the
  `CronScopes` driver lists, each in that scope.
- **Generated wiring**: `.stackra/gen/wiring.ts`, the container bindings and drivers gen derives for a member.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Copy a proven pattern for a real task (Priority: P1)

A developer starting a feature opens `services/example`, finds the task in the README's "Copy a pattern" table (a
tenant-owned model, a write with an event, a listener, a per-tenant job, a test through the generated wiring, sign-in in
a test, an isolation test) and copies the files named there.

**Independent Test**: `stackra gen`, `stackra test` and `stackra test --tier int` pass in `services/example`.

**Acceptance Scenarios**:

1. **Given** a signed-in user of a tenant, **When** they create, update and delete a note, **Then** each change reaches
   the tenant's activity feed after its call commits, newest first, and nothing reaches it from a refused call.
2. **Given** feed entries older and younger than 90 days, **When** the daily cron runs, **Then** one job per tenant runs
   through the queue and deletes only that tenant's old entries.

---

### User Story 2 - A signed-in caller in their tenant (Priority: P1)

**Acceptance Scenarios**:

1. **Given** an access token the identity provider signed for a tenant, **When** it reaches the service, **Then** the
   caller is that user in that tenant, who can then write and read notes.
2. **Given** no token, an expired token, a token for another audience or a forged signature, **Then** the call is the
   one `unauthenticated` refusal.

---

### User Story 3 - A generated service's crons run (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a service that declares `@stackra/scheduler`, **When** gen writes its wiring, **Then** `SchedulerService`
   is bound, so the generated CronJobs can fire.
2. **Given** a service that also declares `@stackra/tenancy`, **Then** its `CronScopes` port defaults to tenancy's
   driver, so a per-tenant cron runs once per tenant.

---

### Edge Cases

- **EC-01**: A refused call (invalid input) publishes nothing, so no listener runs.
- **EC-02**: Another tenant's entries are past the same cutoff; the job run in one tenant never deletes them.
- **EC-03**: A read with no tenant set returns no row: the policy, not a filter, hides them.
- **EC-04**: The retention job has no route and no tool: its only actor is the system.
- **EC-06**: A feed cursor no page gave (malformed or forged) is refused as invalid input (`table_cursor_invalid`), never
  a server error.
- **EC-05**: A test through the generated wiring must choose the outbox publisher (`inbox`) and the tenants of the cron,
  since neither has a memory default.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE example service SHALL hold a tenant-owned `notes` resource (create, get, list, update, delete) through
  the actions pipeline, with permissions, validation, idempotency and integration events carrying ids only.
- **FR-002**: THE example service SHALL hold an `activity` module whose listeners record a feed entry for each notes
  event, in the event's tenant, after the call that published it committed.
- **FR-003**: THE activity feed SHALL be readable over HTTP by a signed-in user and as a read-only MCP tool by an agent,
  newest first, one cursor page at a time.
- **FR-004**: THE activity module SHALL run a daily retention job per tenant, through the queue, with retries, back-off,
  a dead letter and `unique`, that deletes the tenant's entries older than `keepDays` (90 from the cron).
- **FR-005**: WHEN a service declares `@stackra/scheduler` THE generated wiring SHALL bind `SchedulerService`.
- **FR-006**: WHEN a service declares `@stackra/scheduler` and `@stackra/tenancy` THE generated wiring SHALL default the
  `CronScopes` port to tenancy's `tenancy` driver.
- **FR-008**: WHEN `CrudService.table` gets a cursor no earlier page gave THE read SHALL refuse it with
  `TableCursorInvalidError` (validation, field error on `cursor`), and SHALL rethrow any other failure unchanged.
- **FR-007**: THE example's tests SHALL prove sign-in through `CallAuthenticator` over the generated wiring, the feed and
  the cron end to end on the generated wiring, and tenant isolation of both modules on Postgres as the NOBYPASSRLS role.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a signed-in user creates, updates and deletes a note THE activity feed SHALL show the three changes
  after the relay ran, newest first, and none before.
- **AC-002**: WHEN a call is refused THE activity listeners SHALL not run.
- **AC-003**: WHEN the daily cron ticks THE queue worker SHALL delete the tenant's entries older than 90 days and keep
  the newer ones.
- **AC-004**: WHEN the retention job runs in one tenant THE service SHALL keep every other tenant's entries.
- **AC-005**: WHEN a valid token reaches the service THE caller SHALL be its user in its tenant; WHEN the token is
  missing, expired, for another audience or forged THE service SHALL refuse it as `unauthenticated`.
- **AC-006**: WHERE a service declares `@stackra/scheduler` THE generated wiring SHALL bind `SchedulerService`, and
  WHERE it also declares `@stackra/tenancy` THE `CronScopes` port SHALL default to `tenancy`.

- **AC-007**: WHEN a caller reads the feed with a cursor no page gave THE service SHALL refuse it as
  `table_cursor_invalid`.

## Success Criteria _(mandatory)_

- **SC-001**: `activity-feed.test.ts` proves AC-001 to AC-003 on the generated wiring, and fails when the gen change, a
  listener or the prune cutoff is reverted — verified by: unit
- **SC-002**: `sign-in.test.ts` proves AC-005 — verified by: unit
- **SC-003**: `activity-isolation.int.test.ts` and `note-isolation.int.test.ts` prove AC-004 and EC-02, EC-03 — verified
  by: integration
- **SC-004**: `emit-wiring.function.test.ts` and `system-driver-defaults.function.test.ts` prove AC-006 and fail when it
  is reverted — verified by: unit
- **SC-006**: `crud-service.base.test.ts` proves FR-008 and fails when the refusal is reverted; `activity-feed.test.ts`
  proves AC-007 — verified by: unit
- **SC-005**: the example's and gen's tests, typecheck, oxlint and oxfmt pass, and `stackra gen --check` is clean —
  verified by: manual

## Compatibility and migration

- A service that declares `@stackra/scheduler` gets one more binding; its boot now builds `SchedulerService` and its
  dependencies (the queue service, the lock, the schedule store and `CronScopes`), which its crons needed anyway.
- A service that declares both the scheduler and tenancy now lists the tenant nodes for a per-tenant cron instead of no
  scope. A host that wants another driver still picks it.

## Risks

- **R-1**: A deployed boot of the example still stops on ports with two drivers and no selector (`ChangeFeed`,
  `EventPublisher`, `InboxDriver`, `ScopeTree`); STA-2657 adds those selectors package by package. Tests choose drivers
  explicitly, so they are not affected.
- **R-2**: The root runway's Encore app id names the reference services' app; no target here deploys it.

## Out of scope

- The deployed-boot selectors of R-1 (STA-2657).
- Making `services/health` a real service (STA-2828).
- Porting the example to the starter (template), which builds on published packages.

## Assumptions

- The generated test setup and `createTestingModule` are how a service tests through its own wiring.
- A feed's retention of 90 days is example data, passed as the cron's input.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2856 session) · created from the audit item and the branch's diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2856 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2856 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2856 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2856 session) · T001 to T010 on the branch
