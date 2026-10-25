# Plan: `@stackra/workflow` wave 7

**Spec**: `.agents/specs/sta-348-workflow/spec.md`

## Design

- Three entries through stand-in barrels (STA-339 replaces them): `.` from `src/core/` with `src/config/`, `./node`
  from `src/node/`, `./testing` from `src/testing/`.
- Kinds: `Workflow = createKind("workflow", WorkflowBase, read)` cast to `<I = void>(options: WorkflowOptions<I>) =>
WorkflowClass<I>`; `WorkflowBase<I>` carries the type-only `~input`. `Signal` is an abstract class registered with
  `registerKind`. `Step = createDecorator({ kind: "step", target: Method, kinds: ["workflow"] })` cast to a generic
  `StepKind` whose decorator type takes only `StepName<T>`. `Run<W>`, `ResultsOf<W>` and `StepName<W>` per the spike.
- `planOf(type)` (cached): methods from the prototype chain below `WorkflowBase`, ancestors' first; steps are all but
  `output` and `undo<Step>`; each undo matched to its step; `@Step` options checked (durations through
  @stackra/validation's `duration`, `retry.attempts` from 1, `Backoff` codes, `waitFor` a signal); `after` ordered by a
  stable topological pass. The key is `registerWorkflows`' or the class name.
- `NativeWorkflowRunnerDriver(journal, locks, clock)` with `connect(resolver)`: `start` mints the run id (derived from
  the correlation for `startOn`), reads the caller's scope, and under `Locks.with("workflow.run:<id>")` saves the run
  and advances it. `advance` walks the plan: skip done and skipped steps, time out past the deadline, skip on `when`,
  then `attempt` (one `journal.transaction` per attempt: take the held signal, run the body inside `ContextStorage.run`,
  write integration events to `EventOutbox`, save the step done; dispatch domain events to `EventBus` after; retry with
  `backoffDelay` while retryable and inside the deadline). A parked wait is saved `waiting` with its `wakeAt`, then
  looks once more for a signal. A failure saves the run `compensating` and runs the undos last first; an undo failure
  leaves it `failed`. `hold` stores a signal in the caller's transaction; `tick` expires signals and resumes each due
  run under `Locks.tryWith`; `work` ticks with a one-second idle poll.
- `MemoryWorkflowJournalDriver` keeps structured clones in maps; `PostgresWorkflowJournalDriver` runs bound statements
  on `workflow.runs`, `workflow.steps` (one `jsonb_to_recordset` upsert per save) and `workflow.signals` (`delete …
for update skip locked returning` for `take`), created by `CreateRunsMigration` with the `ltree` extension.
- `WorkflowExplorer(container, runner)`: connects a native runner, plans each built workflow, subscribes an in-process
  starter per `startOn` workflow to `EventBus`.
- `./testing`: `WORKFLOW_TESTING_PLUGIN` (the app's native runner, else one on the memory journal and locks), `app.
workflows.last` and `.advanceClock` (an offset on the engine's time, ticking until idle), `runWorkflow` and `signal`.
- `WorkflowConfig extends Config({ schema: WorkflowEngineOptions })`, with `WorkflowConfig$` and the `DriverRegistry`
  entry of the journal beside it, as @stackra/outbox has them.

## Constitution Check

| Law                                   | Result | Note                                                                                                         |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/workflow`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; the Postgres journal uses the service's own connection                  |
| Security                              | PASS   | every value is a bound parameter; the caller comes from the call descriptor, never from input                |
| HTTP and events                       | PASS   | no endpoint; workflows run only behind an action or `startOn`; refusals are typed (`workflow_timed_out`)     |
| Tenancy                               | PASS   | no tenant word declared; a scope is a `ScopeRef`, opened per step; signals match their scope (spec Impact)   |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests       |
| Not built yet (ADR 0227)              | PASS   | Postgres and memory only; no Temporal, no external state-machine library, no queue broker                    |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                    |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                            |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                    |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                           |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0102 stands, the gaps are listed in the spec                   |

- Boundaries: runtime imports of actions, config, container, contracts, database, errors, events, locking, queue and
  validation; dev-only `@stackra/testing` and the tooling presets; no `@mikro-orm/*` (ADR 0097 d2).
- Versions: catalogs and `workspace:*` only.
- Naming: drivers `<Name>Driver`, the explorer `WorkflowExplorer`, the migration `CreateRunsMigration`, noun kinds
  without suffix (`Signal`), `Precondition` never Guard (the engine's `Guard` is an attempt's abort signal, internal),
  no `define` prefix, `StepStatus` and `WorkflowRunStatus` are `Enum.of` values.

## Properties

- **P-001**: `package.json` names `@stackra/workflow` at `packages/runtime/workflow`, `exports` lists only `.`, `./node` and `./testing`, and `.` exports every template symbol — Validates: FR-001
- **P-002**: for every workflow class, the planned steps are exactly its methods other than `output` and `undo<Step>`, in declaration order moved only by `after`, and `Run<W>["results"]` types each by its resolved return — Validates: FR-002
- **P-003**: for every run, each step that commits is recorded done once, in plan order; when a step fails after its attempts or times out, exactly the done steps with an undo are compensated, in reverse plan order, and the caller receives that step's error — Validates: FR-003
- **P-004**: for every waiting step, it resumes only on a held signal of its key, canonical correlation and scope that arrived at or before its wake time, takes that signal once, and otherwise times out at its wake time — Validates: FR-004
- **P-005**: for every Postgres method, the SQL holds no value text and has as many placeholders as parameters, and the memory journal returns the same records for the same calls — Validates: FR-005
- **P-006**: at boot every built workflow is planned and each `startOn` workflow is subscribed; two starts with the same correlation run its steps once — Validates: FR-006
- **P-007**: `app.workflows.advanceClock(d)` times out exactly the waits whose wake time falls within the moved time, and `runWorkflow` returns the journal record of the run it started — Validates: FR-007
- **P-008**: `buildConfig(WorkflowConfig)` equals `WorkflowConfig$.parse({})` with journal `postgres`, and `grep -rE "(const|let|class|interface|type|function) [A-Za-z]*[Tt]enant" packages/runtime/workflow/src` finds nothing — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| SaaS       | the same build; the Postgres journal in the service's database, one worker loop per service          |
| On-prem    | identical: the same build; Postgres holds the journal, no workflow service or broker is needed       |
| Air-gapped | identical: needs no network; the journal, the locks and the timers all live in the deployment itself |
