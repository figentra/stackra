# Feature Specification: `@stackra/scheduler` wave 6, cron dispatch and per-scope schedules

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/scheduler` (runtime, wave 6): cron dispatch of the actions whose `job` option has a `cron`,
misfire catch-up within a bounded window, per-scope schedules kept as data (ADR 0148 decisions 4 and 5), one runner per
tick through `@stackra/locking`, every run pushed through `@stackra/queue`.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce crons, `orders.order.expire_unpaid@1`,
  `loyalty_kit.points.expire@1` and `access_log.entry.purge@1`, run on it once converted, STA-344)
- **Packages touched**: `packages/runtime/scheduler` (new member)
- **Cross-service events**: none
- **Tenancy and data**: two tables in the package's own schema, `scheduler.schedules` (keyed by scope:
  `scope_id`, `scope_path` ltree) and `scheduler.watermarks`; no row-level-security policy, because one runner reads
  every scope's schedules each tick (as the queue's workers read every scope's jobs), so a scope's reads and deletes
  bind `scope_id` themselves (for the owner's data review); no tenant vocabulary (R-59, ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0148, 0078 as amended and 0103 decide the package; ADR 0160, 0294 and 0305 bind it); the gaps
  are listed under Open items
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); the cron parser
  is written in the package because no catalog carries croner or cron-parser
- **Deploy modes**: same code in all; in SaaS gen's Encore CronJob calls `tick`, on-prem and air-gapped `run` is the
  timer (ADR 0148 decision 4)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/runtime/scheduler/README.md`, `packages/runtime/scheduler/AGENTS.md`; ADR 0148 is cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract every scheduled job of the platform relies on to run once per tick)

## Clarifications

### Session 2026-10-25

The package follows ADR 0148, the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and
v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: entry `.`; the template imports nothing from it. The ports go to `./contracts`, the Postgres driver and
  migration to `./node`, the `tick` helper to `./testing`, because each folder has a file (ADR 0127 note)
- A cron is the `job.cron` sub-option of `Action({...})` (R-13, ADR 0305 rule 28): `schedule` (five fields, UTC),
  `perTenant`, `input`; no `@Cron`. Gen's entry registers the job actions with their locked keys
  (`registerScheduledJobs`, the same rows as queue's `registerJobs`)
- Cron parser: written here (classic five fields, names, ranges, steps, lists, the either-day rule); `pnpm-workspace.yaml`
  has no croner or cron-parser, so no new dependency
- One runner per tick: `Locks.tryWith("scheduler:tick", ...)`; a watermark per cron and schedule (the last tick that
  evaluated it) keeps a second tick of the same minute from pushing twice; with the Postgres drivers the pushes and
  watermarks commit in the lock's transaction
- Misfire: `Misfire.CatchUp` (default), `Once`, `Skip`, never further back than `catchUpWindow` (one hour by default,
  one minute to one day); a cron takes the config's policy, a stored schedule its own
- Per-scope schedules as data (ADR 0148 decision 5): scope, locked job key, cron, IANA time zone, input, policy; the
  action is named by key, so a schedule only references registered code (ADR 0154)
- Per-scope crons fan out over the `CronScopes` port; the package that owns the scheduling level binds it
  (@stackra/tenancy), the memory driver serves tests and a single process. No tenant word here (R-59)
- `QueueService.push` is the only way out (ADR 0078 decision 6: a scheduler handler only dispatches); a unique job
  that still waits is not pushed again

## User Scenarios & Testing

### User Story 1 - Dispatch a job action's cron (Priority: P1)

A job action declares `job: { cron: { schedule } }`; each minute one tick pushes its run, once for the platform or once
per scope `CronScopes` lists, with its input.

**Independent Test**: `src/core/services/__tests__/scheduler.service.test.ts`,
`src/core/functions/__tests__/register-scheduled-jobs.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a cron `0 * * * *`, **When** a tick runs at 12:00:30, **Then** one job is pushed, and a second tick at
   12:00:50 pushes none.
2. **Given** a per-scope cron and two scopes, **When** it comes due, **Then** one job per scope is pushed with the
   cron's input.

### User Story 2 - Catch up missed runs (Priority: P1)

After downtime a tick pushes the runs it missed within the catch-up window under the misfire policy.

**Independent Test**: `src/core/services/__tests__/scheduler.service.test.ts`.

### User Story 3 - Keep per-scope schedules as data (Priority: P1)

A module stores a schedule for its scope with a cron, time zone and input; each tick pushes its due runs in that scope;
a scope deletes only its own schedules.

**Independent Test**: `src/core/services/__tests__/scheduler.service.test.ts`,
`src/core/functions/__tests__/cron-runs.function.test.ts`.

### User Story 4 - Store schedules in Postgres (Priority: P1)

The Postgres driver keeps schedules and watermarks in the package's schema with bound statements.

**Independent Test**: `src/node/drivers/__tests__/postgres-schedule.driver.test.ts`,
`src/node/database/migrations/__tests__/0001-create-schedules.migration.test.ts`.

### User Story 5 - Fire a cron in a test (Priority: P2)

A test calls `tick(at)` on the compiled testing app and `drainQueue()` runs what it pushed.

**Independent Test**: `src/testing/functions/__tests__/tick.function.test.ts`.

### Edge Cases

- Another instance holds the tick: `{ ran: false }`, nothing pushed.
- A stored schedule names an action this process does not know, or a cron or time zone the runtime refuses: skipped,
  listed in the result, its watermark kept.
- A cron new to the store: it looks back one minute, so a deploy never replays a window.
- A daylight-saving change: a skipped wall time does not run that day; a repeated one runs at both instants.
- A malformed cron or unknown time zone on `schedule`: `invalid_cron` or `invalid_time_zone`.

## Requirements

- **FR-001**: The package SHALL be `@stackra/scheduler` at `packages/runtime/scheduler`, `tier:lib`, entries `.`,
  `./contracts`, `./node` and `./testing` only.
- **FR-002**: It SHALL export `SchedulerService` from `.` with `tick`, `run`, `schedule`, `unschedule` and `schedules`,
  and `registerScheduledJobs`, `parseCron`, `cronRuns`, the refusals, the memory drivers and the configuration beside
  it.
- **FR-003**: `SchedulerConfig` with its shipped `SchedulerConfig$` SHALL key `scheduler` with `driver` typed
  `DriverName<ScheduleDriver>` (`postgres` default, `memory`), `catchUpWindow` (one minute to one day, one hour
  default) and `misfire` (`catch_up` default).
- **FR-004**: `parseCron` SHALL read the classic five fields and refuse anything else with `InvalidCronError` naming
  the field; `cronRuns` SHALL list the whole minutes in `(after, until]` whose wall clock in the time zone matches.
- **FR-005**: A tick SHALL run on one runner (`Locks.tryWith`), push every due run after each watermark within the
  window under the misfire policy through `QueueService.push`, and advance the watermarks last.
- **FR-006**: A per-scope cron SHALL push once per scope `CronScopes` lists; a stored schedule SHALL push in its own
  scope and time zone and never a run from before it was made.
- **FR-007**: `PostgresScheduleDriver` SHALL bind every value, read every row through zod, delete a schedule only with
  its scope and with its watermark, and advance every key in one upsert; the migration SHALL comment every column.
- **FR-008**: `./testing` SHALL export `tick(at?)` acting on the testing app compiled last.
- **FR-009**: No identifier, comment or default the package declares SHALL carry tenant vocabulary, and no `@Cron`
  decorator SHALL exist.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- `@stackra/actions`' `JobCron.perTenant` carries the tenant word R-59 bans outside tenancy; the template uses it, so
  this package reads it as is. A rename to `perScope` is an actions and template change.
- ADR 0148 decision 5 also names jitter and heartbeats for schedules: jitter needs a delayed push, which
  `QueueService.push` does not take yet (it queues "due now"); heartbeats wait for the telemetry heartbeat check of ADR 0184. One-shot timed updates (ADR 0321 decision 6, ADR 0161 decision 5) are not built: the schedules here are
  recurring crons.
- A tick runs its pushes one after another inside one transaction; a deployment with very many per-scope crons may
  want batched pushes once volume shows it.
- No `CronScopes` driver ships for a deployment with scopes: @stackra/tenancy binds one (wave follow-up).

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
