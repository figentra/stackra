# Feature Specification: `@stackra/queue` wave 5, the runtime of an action's `job:` option

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/queue` (runtime, wave 5): the runtime of an action's `job:` option (ADR 0305 rule 28) with
the job features of ADR 0148 that the option declares: a typed queue, uniqueness, a timeout, retries with backoff and
jitter, and a dead-letter queue with replay and the `onDeadLetter` hook; drivers behind a port (ADR 0142): memory and
Postgres with `SKIP LOCKED`. It implements @stackra/actions' `JobDispatcher` port behind `ctx.dispatch`, and it is the
enqueue side of a queued call (`client.x.y.queue(input)`, ADR 0260 decision 4). The scheduler, the outbox, webhooks,
media, search and notifications build on it in later waves.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's notifications and commerce services adopt it once converted, STA-344)
- **Packages touched**: `packages/runtime/queue` (new member)
- **Cross-service events**: none
- **Tenancy and data**: one table, `queue.jobs`, in the package's own schema: the platform's job store, read by workers
  across scopes, so it carries no row-level-security policy; a job's scope is data (`scope_id`, `scope_path`) that the
  worker opens as the database scope session of each attempt; no tenant vocabulary is declared (R-59, ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0148 decides the job features and drivers, ADR 0305 rule 28 the typed surface; ADR 0142, 0160,
  0294 and 0328 bind it); the gaps are listed under Open items
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges to
  actions, config, container, contracts, database, errors and validation
- **Deploy modes**: same code in all; the Postgres driver on every mode, the memory driver for tests and one process
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/runtime/queue/README.md`, `packages/runtime/queue/AGENTS.md`; ADR 0148 is cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract that every job, queued call and later runtime package relies on)

## Clarifications

### Session 2026-10-24

The package follows ADR 0148, ADR 0305 rule 28, the v3.1 registry row and the owner decisions of 2026-10-24
(programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: `.` exports `Backoff` and `queues`, `./testing` exports `drainQueue` and `runJob`; `./contracts` (the
  `QueueDriver` port and the stored job types) and `./node` (the worker and the Postgres driver) exist because each has
  a file (ADR 0127 note); one symbol, one entry (ADR 0294 d15)
- Owner decision R-13: job, queue and cron are typed sub-options of `Action({...})`; no `@Job` or `@Queue`. The option's
  type and its checks are @stackra/actions' (`JobOptions`); this package reads it and adds the checks Action leaves to it
  (the backoff code, the dead-letter method)
- Template contract: `queues(["default", "maintenance"] as const)` gives `Queues.Default` and `Queues.Maintenance`;
  `Backoff.Exponential` in a `job` option and in a workflow step's `retry`; `drainQueue()` with no argument runs the
  delivery job a send dispatched; `runJob(DeliverMessageAction, input)` runs every attempt and
  `expect(job).toDeadLetter({ attempts: 6 })` passes for five retries
- The template's job actions list only `ActorKind.System` ("the job adds `ActorKind.Job` itself"), and the pipeline
  refuses an actor kind the action does not list, so a job runs as the `job` actor when the action lists it and as the
  `system` actor otherwise, with the caller as `onBehalfOf`
- A queued call of an action without a `job` option (`payments.payment.void.queue(...)`) runs as its caller, under the
  Idempotency-Key it was sent with, on the `default` queue
- Defaults when the option leaves a field out: queue `default`, three retries, exponential backoff, a five-minute
  timeout (ADR 0148: a job with no timeout is a review finding, so the default is a floor)
- Backoff: a ten-second step (fixed, linear or doubled), up to half a step of jitter, capped at an hour
- A refusal that is not retryable ends a job at once; any other error, a timeout included, is retried
- After the last attempt a `deadLetter: true` job is kept for a redrive and `onDeadLetter` runs once; any other job is
  removed and the failure logged
- Every attempt carries an Idempotency-Key (the queued call's, else one derived from the job id when a store is bound),
  so an attempt that ran but was not recorded replays (ADR 0136 decision 3)
- Scope (ADR 0327, 0323): a job carries a `ScopeRef`; the worker runs each attempt inside `Database.withScope`; a unique
  job is unique per scope
- Owner, 2026-10-24: data gate lifted, so the Postgres driver and its migration build now; the model review happens on
  the data-wave PR

## User Scenarios & Testing

### User Story 1 - Run an action as a job (Priority: P1)

An action declares `job: { queue: Queues.Delivery, retries: 5, backoff: Backoff.Exponential, deadLetter: true }`;
another action calls `ctx.dispatch(DeliverMessageAction, input)`; a worker runs it through the pipeline.

**Independent Test**: `src/node/services/__tests__/queue-worker.service.test.ts`,
`src/core/drivers/__tests__/queue-job-dispatcher.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a dispatched job, **When** a worker drains its queue, **Then** the action runs as the system actor on
   behalf of the caller and the job is removed.
2. **Given** a job whose provider is down, **When** it fails five times more, **Then** it is dead-lettered and
   `onDeadLetter` runs once.

### User Story 2 - Name the queues (Priority: P1)

Gen writes `export const Queues = queues([...] as const)` into `#stackra/queues`, and code writes `Queues.Maintenance`.

**Independent Test**: `src/core/functions/__tests__/queues.function.test.ts`.

### User Story 3 - Keep jobs in Postgres (Priority: P1)

The Postgres driver keeps jobs in `queue.jobs`, hands each due job to one worker with `FOR UPDATE SKIP LOCKED`, and
queues a unique job once.

**Independent Test**: `src/node/drivers/__tests__/postgres-queue.driver.test.ts`,
`src/node/database/migrations/__tests__/0001-create-jobs.migration.test.ts`.

### User Story 4 - Test a job (Priority: P1)

A test calls `drainQueue()` after a send, or `runJob(Action, input)` and `expect(job).toDeadLetter({ attempts })`.

**Independent Test**: `src/testing/functions/__tests__/drain-queue.function.test.ts`,
`src/testing/functions/__tests__/run-job.function.test.ts`, `src/testing/__tests__/to-dead-letter.matcher.test.ts`.

### User Story 5 - Redrive a dead letter (Priority: P2)

An operator lists the dead letters of a queue and redrives one; it runs again with all its attempts.

**Independent Test**: `src/core/services/__tests__/queue.service.test.ts`.

### Edge Cases

- A unique job pushed while another of the same scope waits or runs: skipped (`push` gives `undefined`).
- A job whose key the worker does not know (release skew): dead-lettered at once with `unknown_job`.
- An attempt past its timeout: its abort signal fires and it is retried with `job_timed_out`.
- A worker that dies mid-attempt: its reservation lapses after the timeout and a minute, and another worker takes it.
- `onDeadLetter` that throws: logged; the dead letter stays.

## Requirements

- **FR-001**: The package SHALL be `@stackra/queue` at `packages/runtime/queue`, `tier:lib`, entries `.`,
  `./contracts`, `./node` and `./testing` only.
- **FR-002**: It SHALL export `Backoff` and `queues` from `.` with the template's call shapes, and `drainQueue` and
  `runJob` from `./testing`, with the `toDeadLetter` matcher the template's test uses.
- **FR-003**: `QueueConfig` with its shipped `QueueConfig$` SHALL key `queue` with `driver` typed
  `DriverName<QueueDriver>` (`postgres` default, `memory`).
- **FR-004**: `QueueService.push` SHALL store one waiting run of an action on its declared queue with the caller, the
  scope, the Idempotency-Key and a lease, skip a unique job already waiting or running in the same scope, and refuse a
  queued call of an action without a `job` option that names no caller.
- **FR-005**: `QueueWorkerService` SHALL run each attempt through the action pipeline as the job's actor, inside the
  job's scope session and with the job's scope as the call's scope, with its timeout, then remove the job, retry it after its backoff, dead-letter it and call
  `onDeadLetter` once, or drop and log it.
- **FR-006**: `QueueJobDispatcherDriver` SHALL implement `JobDispatcher` so `ctx.dispatch` stores the job on behalf of
  the calling actor, in the call's scope (`CallDescriptor.scope`, ADR 0327 decision 6).
- **FR-007**: `PostgresQueueDriver` SHALL reserve with `FOR UPDATE SKIP LOCKED`, decide a unique conflict by the partial
  unique index, bind every value as a parameter and read every row through zod; `MemoryQueueDriver` SHALL behave the
  same in one process.
- **FR-008**: No identifier in the package SHALL declare tenant vocabulary, and no `@Job` or `@Queue` decorator SHALL
  exist.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  runs against sibling sources through a scratch configuration until the integrator's install.

## Open items (for the owner, not blocking)

- Resolved 2026-10-25 (R1): `CallDescriptor` now carries the call's `scope`, so a job queued by `ctx.dispatch` keeps
  it and the worker opens that scope session and passes it on as the call's scope. A call with no scope (a platform
  call, or a transport that does not resolve one yet) still queues a platform job.
- Gen needs: `registerJobs` rows (the job actions with their locked keys) in each generated entry, the generated
  Encore Topic and subscription that call `QueueWorkerService.process` in SaaS (ADR 0148 decision 6), the queued-call
  adapter that answers `Prefer: respond-async` by pushing, and the workers `createApp` starts per runway queue.
- Not built, because no `job` option declares them yet: priority, delay, batches and chains, progress, per-scope fair
  queuing (ADR 0148 decisions 1 and 2) and a Valkey driver (decision 3); queued listeners (`Listener({ queue })`) need a
  seam in @stackra/events' bus first.
- The failed-jobs console resource the template mentions waits for @stackra/panel (wave 8).
- Dead letters are kept until redriven; a retention purge job comes with the scheduler.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
