# Feature Specification: `@stackra/workflow` wave 7, durable workflows on a Postgres journal

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/workflow` (runtime, wave 7): the registry row "`Workflow({ startOn, correlate, timeout })`,
`@Step`, `Signal`, `Run<W>`; durable Postgres journal, in-process test driver" with the `.` exports `Run`, `Signal`,
`Step`, `StepContext`, `StepStatus`, `Workflow` and `WorkflowRunStatus`, every symbol the template imports (the
loyalty kit's redeem workflow and signal, the commerce create-order workflow and its integration test), the
`WorkflowRunner` port @stackra/actions left for `ctx.run` and `ctx.signal`, and the decisions of ADR 0101, 0102, 0151,
0152 and 0292 as amended by ADR 0294 and 0305.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service and loyalty kit list it; they adopt it once converted,
  STA-344)
- **Packages touched**: `packages/runtime/workflow` (new member)
- **Cross-service events**: none declared here; a step's integration events leave through the outbox
- **Tenancy and data**: three tables in the package's own schema. `workflow.runs` and `workflow.signals` carry
  `scope_id` and `scope_path` (`t.scopeId()`, `t.scopePath()`, nullable): a run takes the scope of the call that started
  it, a signal the scope of the call that sent it. No table has a row-level-security policy, because the worker
  advances every scope's runs (data review); the engine opens a run's scope as the session of each of its steps, and a
  signal is taken only by a run of the same scope. `workflow.steps` belongs to its run (foreign key, cascade). No tenant
  vocabulary is declared (R-59, ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0101, 0102, 0151, 0152 and 0292 decide the engine, the journal, the port, the semantics and
  the drivers; ADR 0294 decisions 3, 6, 16, 18 and 25 the authoring form); the gaps are listed under Open items
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges to
  actions, config, container, contracts, database, errors, events, locking, queue and validation
- **Deploy modes**: same code in all; the Postgres journal on every mode, the memory journal for tests and one process
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177). The Temporal driver is
  Pro and not here (ADR 0292 decision 3)
- **Docs to update**: `packages/runtime/workflow/README.md`, `packages/runtime/workflow/AGENTS.md`; ADR 0102 is cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract every multi-step action relies on)

## Clarifications

### Session 2026-10-25

The package follows the registry row, the template's imports and the owner decisions of 2026-10-24. The choices
recorded when it was specified:

- Entries: `.`, `./node` and `./testing`, each with files (ADR 0127 note). No `./contracts`: the template imports
  `StepStatus` and `WorkflowRunStatus` from `.`, and the journal port and its records name them, so the port lives in
  `src/core/ports/` (one symbol, one entry, ADR 0294 d15; the @stackra/database precedent)
- The engine port of ADR 0151 d2 is @stackra/actions' `WorkflowRunner` (the port `ctx.run` and `ctx.signal` reach); the
  native engine is `NativeWorkflowRunnerDriver` (driver name `native`, as the template's `useDrivers({ workflow:
"native" })` reads), over a `WorkflowJournal` port whose drivers are `postgres` (ADR 0292's Postgres journal, the
  default) and `memory`. A Temporal driver implements `WorkflowRunner` later
- Authoring (ADR 0294 d3, d18): `Workflow` is called only and generic in its input; steps are every method other than
  `output` and `undo<Step>`, ancestors' first, in declaration order, moved only by `after`; `@Step` (made with
  `createDecorator`) records options only; `Run<W>` keeps its conditionals on the naked `W` (STA-335 spike); `Signal` is
  bare only (kind table: no options)
- Each step is a transaction of its own (`WorkflowJournal.transaction`, `requiresNew`) that also writes the step's
  journal row, so a saga's steps commit whatever the calling action does (ADR 0102 d2); one runner per run under
  `Locks`; a tick takes over a run whose lock is free
- Retries: `retry: { attempts, backoff }` with @stackra/queue's `Backoff` and `backoffDelay`; a non-retryable refusal
  fails at once; a retry waits in process, bounded by the run timeout (marked `shortcut:`)
- Waits (ADR 0152 0294 note): a `waitFor` step parks the run; the signal is held in the sender's transaction, matched by
  key, canonical correlation and scope, and taken by the next tick; an early signal is held; a signal that arrived
  before the wait timed out wins however late the tick; untaken signals are dropped after seven days
- `ctx.run` resolves with `output(run)` once the run completes, or once it parks (over the results so far, so the action
  answers while the run waits); it rejects with the failing step's error, or `workflow_timed_out`, after compensating
- Timers and take-overs are journal rows the worker loop (`work`) polls every second, not queue jobs: a queued job is an
  action, which would need its own key and permission. The queue gives the backoff
- Events: a step's `ctx.record` writes integration events through @stackra/events' `EventOutbox` (implemented by
  @stackra/outbox) inside the step's transaction and dispatches domain events to `EventBus` after the commit
- `startOn` runs are keyed by their correlation (a derived run id), so a repeated event starts nothing; the explorer
  subscribes a starter per `startOn` workflow at boot
- Step states: @stackra/state-machine governs a model field, and the journal rows are not models, so the engine writes
  the statuses directly
- Owner, 2026-10-24: data gate lifted, so the Postgres journal and its migration build now; the model review happens on
  the data-wave PR

## User Scenarios & Testing

### User Story 1 - Run an action's multi-step work with compensation (Priority: P1)

`order.create` runs price, reserve stock, create order and authorize payment; a refused payment undoes the order and
the reservation, last first, and the action refuses with the payment's refusal.

**Independent Test**: `src/core/drivers/__tests__/native-workflow-runner.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a workflow whose steps all succeed, **When** an action runs it, **Then** every step is recorded done in
   order and the action returns `output(run)`.
2. **Given** a step that is refused, **When** the run reaches it, **Then** each earlier step with an undo is
   compensated, last first, the run is `compensated` and the refusal reaches the caller.

### User Story 2 - Wait for a signal, or time out (Priority: P1)

A redemption parks until the host confirms; a confirmation resumes it, and no confirmation within 15 minutes credits the
points back.

**Independent Test**: `src/core/drivers/__tests__/native-workflow-runner.driver.test.ts`,
`src/testing/functions/__tests__/signal.function.test.ts`.

### User Story 3 - Keep the journal in Postgres (Priority: P1)

**Independent Test**: `src/node/drivers/__tests__/postgres-workflow-journal.driver.test.ts`,
`src/node/database/migrations/__tests__/0001-create-runs.migration.test.ts`.

### User Story 4 - Test a workflow in process (Priority: P2)

**Independent Test**: `src/testing/constants/__tests__/workflow-testing-plugin.constant.test.ts`,
`src/testing/functions/__tests__/run-workflow.function.test.ts`.

### Edge Cases

- A signal sent before the run parks: held, taken when the run reaches its wait.
- A signal of another correlation or scope: never resumes the run.
- A process that dies mid-run: the next tick takes the run over once its lock frees; steps are idempotent on the run.
- An undo that throws: the run stays `failed` with the undo's error on its step, for an operator.
- A second `startOn` event for the same key: starts nothing.

## Requirements

- **FR-001**: The package SHALL be `@stackra/workflow` at `packages/runtime/workflow`, `tier:lib`, entries `.`,
  `./node` and `./testing` only, with every template import (`Run`, `Signal`, `Step`, `StepContext`, `StepStatus`,
  `Workflow`, `WorkflowRunStatus`) from `.`.
- **FR-002**: `Workflow`, `Signal`, `@Step`, `Run<W>` and `StepContext` SHALL follow ADR 0294 d3, d6, d18 and d25: a
  called, input-generic workflow base; a bare signal base; a recording-only step decorator typed to steps; results typed
  through the naked `W`; a step context that extends `ExtensionContext`.
- **FR-003**: `NativeWorkflowRunnerDriver` SHALL implement `WorkflowRunner`, run steps in plan order each in its own
  transaction with its journal row, retry within the step's budget, and compensate done steps last first on a failure
  or timeout, resolving with `output(run)` or rejecting with the error.
- **FR-004**: A `waitFor` step SHALL park the run until a held signal of the same key, correlation and scope that arrived
  before the wait timed out, or until the wait or run times out.
- **FR-005**: The Postgres journal SHALL bind every value, read every row through zod, keep runs and signals with their
  scope, and take a signal at most once; the memory journal SHALL behave the same in one process.
- **FR-006**: `WorkflowExplorer` SHALL connect the native engine, plan every built workflow and subscribe each
  `startOn` workflow at boot; a `startOn` run SHALL start once per correlation key.
- **FR-007**: `./testing` SHALL provide the in-process driver: the plugin with `app.workflows.last(W)` and
  `app.workflows.advanceClock(d)`, `runWorkflow` and `signal`.
- **FR-008**: `WorkflowConfig` with its shipped `WorkflowConfig$` SHALL key `workflow` with `journal` (`postgres`
  default, `memory`); no identifier SHALL declare tenant vocabulary.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (owner instruction: lint and format only).

## Open items (for the owner, not blocking)

- Outbox staging per run (ADR 0102 d3): a step's events leave when the step commits; staging until the run succeeds
  needs a staged state in @stackra/outbox.
- Version pin (ADR 0152 d2): a resumed run runs the current code; pinning needs gen's per-version workflow table.
- Not built: `waitFor` an event (only signals), workflow hooks (ADR 0102 d4), the inspect, retry and cancel actions
  (ADR 0152 d4), the Temporal driver (Pro), the purity lint (STA-340).
- Template: the loyalty kit's timeout test expects a result taken before the timeout to refuse with
  `workflow_timed_out`; a run that parks answers with its output, so that assertion cannot hold (the run record does
  show the compensation).
- Timers poll the journal rather than ride the queue; a retry waits in process (bounded by the run timeout).
- Gen needs: `registerWorkflows` rows in each generated entry, the explorer and the native engine in the wiring, and
  `runner.work` per service.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
