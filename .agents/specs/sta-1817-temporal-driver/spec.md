# Specification: the Temporal driver behind the workflow port

**Feature Branch**: `figentra/sta-1817-temporal-driver`

**Created**: 2026-11-01

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1817

**Clarifications status**: complete

<!-- Scope and semantics are settled by ADR 0151, 0152 and 0292. The decisions they leave open are listed under
"Open questions", each with a proposed answer; the owner rules on them before this spec moves to Tasked. -->

**Input**: ADR 0151 decision 4 and ADR 0292 decision 3: "The Temporal driver integrates the Temporal TypeScript SDK
directly. It runs on Temporal Cloud or self-hosted, and it is chosen per environment. The driver is part of Pro." Only the
native engine is built (`NativeWorkflowRunnerDriver` over the `WorkflowJournal` port, with the memory and Postgres
journals). The conformance suite of ADR 0151 decision 6 and ADR 0292 decision 5 does not exist: the native engine's own
test (`native-workflow-runner.driver.test.ts`) is the only conformance today, and `@stackra/workflow/testing` exports a
test driver, not a suite.

## What exists and what is missing

- The engine port of ADR 0151 decision 2 is `WorkflowRunner` in `@stackra/actions/contracts`: only `run` and `signal`.
  The operations of ADR 0152 decision 4 (`find`, `last`, `byAutomation`, `cancel`), `startDocument` and `chained`, and
  the worker loop (`tick`, `work`) are methods of the concrete `NativeWorkflowRunnerDriver`. A second driver has nothing
  to implement them against.
- `WorkflowConfig.journal` picks a journal, not an engine; its test refuses `journal: "temporal"` on purpose. There is
  no engine choice in configuration.
- `@temporalio/*` is in no catalog. ADR 0227 does not list Temporal (it is the Pro driver of 0151, note at line 132), so
  the driver is allowed; ADR 0461 lists `runtime/workflow` as "free + studio" with no driver row.
- The runway requirement engines are `postgres`, `valkey`, `s3`, `sns-sqs`; there is no `temporal`.

## Design in brief

Temporal is the **executor**; the Postgres journal stays the **record**. One generic Temporal workflow,
`stackra.run`, interprets a run's plan (the `planOf` step graph captured at start). Every step, undo, `when` and
`correlate` evaluation runs as an activity (or local activity) on the member's own worker, resolved from the container
like a native step, inside `CallIsolation` as the run's stored actor in its scope, writing its step row to the journal
in the same transaction. No author code is bundled into Temporal's deterministic sandbox, so no Temporal type and no
determinism rule beyond ADR 0151's purity lint reaches a module. The journal keeps serving the operations, listings,
lifecycle events and held signals, so both drivers answer the same reads.

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none in this repository; a service opts in per environment through its `runway.yaml` and root
  topology once the driver ships
- **Packages touched**: `packages/runtime/workflow` (the `WorkflowEngine` port, the engine-name registry and
  `workflow.engine` config, the conformance suite in `./testing`, the native engine made to pass it);
  `packages/application/actions` (only if OQ-1 widens `WorkflowRunner` instead of adding a port in workflow);
  `packages/developer/runway` (the `temporal` requirement engine and its environment values); the driver itself is a new
  Pro package, `@stackra-pro/workflow-temporal`, in `figentra/stackra-pro` (OQ-2)
- **Cross-service events**: none new; `WorkflowRunStarted` and `WorkflowRunEnded` stay domain events with the same
  schema on both drivers
- **Tenancy and data**: no new tenant table. Run input, step results, progress and signal payloads leave the service
  for Temporal's history, so on Temporal Cloud they are encrypted by a payload codec before they leave (FR-016). Each
  activity runs in `CallIsolation` as the run's `origin` actor in its scope (ADR 0495). One new platform table for
  signal waits (`workflow.waits`, OQ-4), no RLS, like `workflow.signals`
- **Secrets**: names only, set by a human per environment: `TEMPORAL_API_KEY` (Cloud API key) or the mTLS pair
  `TEMPORAL_CLIENT_CERT` and `TEMPORAL_CLIENT_KEY` (self-hosted with TLS), and `TEMPORAL_PAYLOAD_KEY` (the codec key).
  Declared in the member's `runway.yaml` `secrets`, read from Infisical (ADR 0173)
- **ADR needed**: yes, one record (OQ-9): the `WorkflowEngine` port shape and the engine choice key, the
  executor/record split, the Temporal mapping table, the Pro package placement as an ADR 0461 table row, and the
  `temporal` runway engine
- **New dependencies**: yes, owner approval required, none added by this spec (OQ-3): `@temporalio/client`,
  `@temporalio/worker`, `@temporalio/workflow`, `@temporalio/activity`, `@temporalio/common`, `@temporalio/testing`, and
  optionally `@temporalio/interceptors-opentelemetry`; a new `catalog:workflow` in the Pro repository's workspace, not in
  this one
- **Deploy modes**: SaaS may choose Temporal per environment (Cloud by default, OQ-6); on-prem may run self-hosted
  Temporal as an option; air-gapped keeps the native driver only. Native stays the default everywhere (ADR 0292
  decision 2, ADR 0179)
- **Licence tier**: the port, the engine registry, the config key and the conformance suite are free (`@stackra/workflow`,
  MIT); the driver is Pro (`@stackra-pro/workflow-temporal`, ADR 0151 decision 4, ADR 0292 decision 3, ADR 0461
  decision 2)
- **Docs to update**: `packages/runtime/workflow/README.md` ("Not here", Running it, Testing) and `AGENTS.md`; the
  workflow guide in `apps/docs`; the runway reference (engines); ADR 0461's tier table through the new ADR
- **Lane**: full
- **Change risk**: R3 (tenancy and actor propagation into background units, payment settlement workflows, outbound
  traffic to Temporal Cloud, two new secrets, a new public port and new dependencies)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The conformance suite exists and the native engine passes it (Priority: P1)

A driver author runs `runWorkflowConformance(makeEngine, options)` from `@stackra/workflow/testing` and gets, per case,
the rules the engine missed. The native engine on the memory journal passes every case. This is the gate every later
driver ships behind (ADR 0292 decision 5).

**Independent test**: the suite runs in `@stackra/workflow`'s own tests against the native engine; no Temporal needed.

**Acceptance scenarios**:

1. **Given** the native engine on the memory journal, **when** the suite runs, **then** every case returns no mismatch.
2. **Given** an engine that skips compensation, **when** the suite runs, **then** the compensation case reports a
   mismatch and the others still run.

### User Story 2 - A workflow runs on Temporal unchanged (Priority: P1)

A service sets `workflow.engine: temporal` for production in its `runway.yaml`. Its `RedeemPointsWorkflow` (steps,
`@Step({ retry, timeout, heartbeat, waitFor, correlate })`, `undo<Step>`) runs with the same results, journal rows,
events and refusals as on native. No file under `src/modules/**` changes.

**Independent test**: the conformance suite on the Temporal driver in Temporal's time-skipping test environment.

**Acceptance scenarios**:

1. **Given** a three-step workflow whose third step fails after its retries, **when** it runs on Temporal, **then** the
   completed steps are undone last first, the run ends `compensated`, and `ctx.run` rejects with the step's refusal.
2. **Given** a step that waits for `PaymentConfirmed` correlated by order id and a signal sent before the run reaches the
   wait, **when** the run reaches the wait, **then** it takes the held signal and continues.
3. **Given** a run started on version 1 and a deploy that ships version 2, **when** the run resumes, **then** it runs
   version 1's class and plan.
4. **Given** a step activity whose worker dies after the step's transaction committed, **when** Temporal retries it,
   **then** the step's work does not run twice and the stored result is returned.

### User Story 3 - Business cases that justify Temporal (Priority: P2)

Long-running, high-value flows where an operator wants Temporal's history, replay and Cloud operations: payment
settlement (capture, payout and reconciliation waits over days), subscription lifecycle (trial, renewal, dunning over
months), KYC/KYB (document upload, provider checks, manual review waits), long approvals (multi-level, timeouts,
escalation) and multi-day agent tasks (plans run as document workflows that park on human input). Each is authored as a
plain workflow and runs on either driver; the choice is per environment, never per workflow (OQ-7).

**Acceptance scenarios**:

1. **Given** a subscription workflow parked 30 days on a renewal timer, **when** the time-skipping environment skips
   30 days, **then** the renewal step runs once.
2. **Given** an approval wait with `timeout: "72h"` and no signal, **when** 72 hours pass, **then** the wait refuses with
   `workflow_timed_out` and the run compensates.

### User Story 4 - Operations and observability are the same on both drivers (Priority: P2)

An operator lists an automation's runs, inspects one, and cancels it through the host's actions; the actions call the
`WorkflowEngine` port and do not know the driver. Traces show one span per step, linked to the starting call.

### User Story 5 - On-prem and air-gapped installs never need Temporal (Priority: P3)

An air-gapped install has no `@stackra-pro/workflow-temporal` and no Temporal server; it builds, boots and runs every
workflow on native. A config that names `temporal` where the driver is not installed fails at boot with a message naming
the package.

### Edge cases

- **EC-001** A signal sent inside an action whose transaction rolls back never reaches the run (held in the sender's
  transaction, as on native).
- **EC-002** A run's history nears Temporal's size limits (a for-each of 10,000 items, large step results): the
  interpreter continues as new before the limit, carrying the completed results by reference to the journal (OQ-8).
- **EC-003** The Temporal service is unreachable: `ctx.run` refuses with a retryable refusal and nothing is journalled
  as started; in-flight runs resume when it returns.
- **EC-004** A `cancel` races a step's commit: the step's committed work stands, nothing is undone, the run ends
  `cancelled` (ADR 0152 note, STA-1242).
- **EC-005** A worker is deployed without a run's pinned version class: the run waits (not failed), as on native, and
  `stackra runway deploy` refuses to drop a version with open runs (ADR 0383 decision 5).

## Requirements _(mandatory)_

### The free port and suite (this repository)

- **FR-001** `@stackra/workflow` declares a `WorkflowEngine` port (or widens `WorkflowRunner`, OQ-1) carrying every
  operation a host or the explorer calls: `run`, `signal`, `start`, `startDocument`, `chained`, `hold`, `cancel`,
  `find`, `last`, `byAutomation`, and the worker lifecycle (`connect`, `work`). `NativeWorkflowRunnerDriver` implements
  it with no behaviour change.
- **FR-002** `WorkflowConfig` gains `engine: DriverName<WorkflowEngine>`, default `native`, with its names in a
  `DriverRegistry` entry a driver package augments; `journal` keeps its meaning (the record) on both engines. The
  shipped `WorkflowConfig$` accepts the names gen found (the STA-1805 approach for driver-name fields).
- **FR-003** `@stackra/workflow/testing` exports `runWorkflowConformance(makeEngine, options)`, free of any test
  framework, returning each case's mismatches, modelled on `runSearchConformance`. `makeEngine` returns the engine, a
  container, and a time control (`advance(milliseconds)`), so each driver supplies its own clock.
- **FR-004** The suite covers at least: declaration order and `after`; `when` skip; results passed to later steps;
  retry attempts and backoff; non-retryable refusal; step timeout; heartbeat miss and progress on retry; signal wait,
  early signal held, correlation mismatch ignored; event wait; wait timeout; run timeout; compensation order; undo
  failure; cancel without undo; version pin on resume; `startOn` correlation dedupe; integration events in the step
  transaction and domain events after commit; lifecycle events once per run; `CallIsolation` actor and scope per step;
  for-each with keyed calls; chain depth; `find`, `last` and `byAutomation` results.
- **FR-005** The native engine on the memory journal passes the whole suite in the package's tests.

### The Temporal driver (`@stackra-pro/workflow-temporal`)

- **FR-006** `TemporalWorkflowEngineDriver extends Driver(WorkflowEngine)`, named `temporal`. Module code imports no
  `@temporalio/*` symbol, and the driver package exports none of them from its public types.
- **FR-007** One generic Temporal workflow, `stackra.run`, per member task queue `stackra.<member>`. Its input is the
  run id, workflow key, version, origin and the run input; it captures the plan once in a local activity, so replay
  never re-reads code.
- **FR-008** A step is an activity `stackra.step` resolved from the container by key and version through
  `WORKFLOW_KEYS.versions`; it builds the same `StepContext` (`runId`, `step`, `stepKey`, `attempt`, `progress`,
  `record`, `heartbeat`, `abortSignal`) and runs in `CallIsolation.run(origin.actor, origin.scope, ...)` inside the
  journal's transaction, writing the step row there. `when` and `correlate` are local activities.
- **FR-009** Retries keep the ADR 0152 curve exactly: Temporal's activity retry is off (`maximumAttempts: 1`) and the
  interpreter retries with a durable timer of `backoffDelay(JOB_BACKOFF, ...)`; a refusal that is not retryable fails
  at once. A step `timeout` is the activity's `startToCloseTimeout`, a `heartbeat` its `heartbeatTimeout`;
  `ctx.heartbeat(progress)` heartbeats and stores progress, and the next attempt reads it as `ctx.progress`.
- **FR-010** Waits: a `waitFor` step registers its wait (signal or event name, correlation key, run id), then takes a
  held signal; a held signal wakes the registered run with a Temporal signal `stackra.wake` sent after the sender's
  transaction commits. A wait `timeout` is a timer raced with the wake; a timeout refuses with `workflow_timed_out`.
- **FR-011** The run `timeout` is a workflow timer, not Temporal's run timeout, so a timed-out run compensates first.
  Compensation runs `undo<Step>` activities for completed steps last first.
- **FR-012** `cancel(runId, reason)` cancels the Temporal execution; the interpreter catches the cancellation, aborts the
  running step through its `abortSignal`, undoes nothing and ends the run `cancelled` through the engine's one `end`.
- **FR-013** Version pin: a run's Stackra version is fixed at start (plan and class by key and version). Changes to the
  driver's own interpreter use Temporal `patched()` markers, and each patch is kept until no open execution predates
  it.
- **FR-014** Idempotency: the Temporal workflow id is the run's public id; a `startOn` run with `correlate` uses
  `<workflow key>:<correlation key>` with a reject-duplicate id policy, so a redelivered event starts nothing. A step
  activity that finds its step row already done returns the stored result without running the step again.
- **FR-015** `run` resolves on completion or on the first park, as on native, through Temporal's update-with-start (or
  a query poll where the server lacks it, OQ-5).
- **FR-016** A payload codec encrypts every payload (input, results, progress, signal payloads, failures) with
  `TEMPORAL_PAYLOAD_KEY` before it leaves the process; failure payloads carry the refusal code and message only,
  never a stack or the step input (the package's PII table).
- **FR-017** Observability: each activity runs in a span child of the starting call's trace; Temporal SDK metrics and
  logs go through `@stackra/logger`'s OTLP export (ADR 0184); search attributes hold the workflow key, version and
  status only, never a scope path, actor or PII.
- **FR-018** The driver's tests run the full conformance suite in `TestWorkflowEnvironment.createTimeSkipping()`, mapping
  the suite's `advance` to the environment's time skipping, and pass every case.
- **FR-019** A config naming `temporal` where the driver is not installed fails at boot with an error naming
  `@stackra-pro/workflow-temporal`; with `native`, nothing loads or needs Temporal.

### Deployment

- **FR-020** `@stackra/runway` accepts a `temporal` requirement engine with `address`, `namespace` and the connection's
  secret names per environment, and refuses it in an environment whose mode is air-gapped. The root topology may place a
  member's Temporal worker in `workers.split` like its other workers.

## Success criteria

- **SC-001** The native engine passes 100 % of the conformance cases (FR-005).
- **SC-002** The Temporal driver passes 100 % of the same cases with no case skipped (FR-018).
- **SC-003** `grep -r "@temporalio" services packages` in this repository finds nothing.
- **SC-004** An air-gapped build of the example service resolves no `@temporalio/*` and no `@stackra-pro/*` package.

## Open questions

Each has a proposed answer; none is decided by this spec.

1. **OQ-1 Port shape.** Widen `@stackra/actions`' `WorkflowRunner`, or add a `WorkflowEngine` port in `@stackra/workflow`
   that extends it? _Proposed_: a `WorkflowEngine` port in `@stackra/workflow` (`src/core/ports/`) that extends
   `WorkflowRunner`; actions keeps its two-method port, so `@stackra/actions` does not change.
2. **OQ-2 Package placement.** ADR 0461 lists no driver row for `runtime/workflow`. _Proposed_: a new Pro package
   `@stackra-pro/workflow-temporal` in `figentra/stackra-pro`, passing the free suite, as the search drivers do; the
   ADR of OQ-9 adds the row.
3. **OQ-3 Dependencies.** `@temporalio/client`, `worker`, `workflow`, `activity`, `common` and `testing` (one version
   for all), and `@temporalio/interceptors-opentelemetry`. _Proposed_: approve the six in a `catalog:workflow` of the Pro
   repository at the current SDK release; take the OpenTelemetry interceptor only if `@stackra/logger`'s OTLP path
   cannot carry the spans. `@temporalio/worker` ships a native core binary per platform, and `@temporalio/testing`
   downloads a test-server binary on first use, so CI caches it.
4. **OQ-4 Signals and the held store.** Temporal signals address a workflow id; Stackra signals address a correlation
   and may arrive early. _Proposed_: keep `workflow.signals` as the held store (the sender's transaction), add a
   `workflow.waits` registry written by the waiting run, and wake the run through an outbox delivery after commit. This
   keeps ADR 0152's early-signal and rollback semantics, at the cost of Postgres staying required with Temporal.
5. **OQ-5 `run` resolving on park.** _Proposed_: update-with-start; where a self-hosted server is older, a query poll
   with the same result. Needs the minimum Temporal server version recorded in the ADR.
6. **OQ-6 Cloud or self-hosted for SaaS.** _Proposed_: Temporal Cloud for Figentra SaaS (one namespace per environment
   and region, GCC and EU kept apart per ADR 0186); self-hosted is the customer's option on-prem, not in the ADR 0179
   minimum footprint.
7. **OQ-7 Choice granularity.** Per environment (ADR 0151 decision 4) or per workflow? _Proposed_: per environment and
   member only; a mixed member is not supported, and existing native runs drain on native before a switch (the driver
   refuses to start while the journal holds open native runs for that member).
8. **OQ-8 History size.** _Proposed_: continue-as-new every 1,000 history events or 10 MB, results by reference to the
   journal past 256 KB per payload; both are configuration, never constants.
9. **OQ-9 ADR.** _Proposed_: one new ADR (reserve with `pnpm adr:reserve temporal-driver --issue STA-1817`) recording
   OQ-1, 2, 4, 6 and 7, the mapping table of `plan.md`, and amending ADR 0461's table and ADR 0296's engine list.
10. **OQ-10 Entitlement.** Is the Temporal driver gated by a plan entitlement at runtime, or only by holding the Pro
    package? _Proposed_: the package only, like the search drivers.

## Status history

- 2026-11-01 → Draft (spec-writer, from the STA-1817 brief)
- 2026-11-01 → Clarified (scope fixed by ADR 0151, 0152, 0292; owner decisions pending as OQ-1 to OQ-10)
