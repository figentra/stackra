# @stackra/workflow

Stackra workflows: the answer to "this action crosses modules, calls an external system, must undo an earlier effect
when a later one fails, waits for a human or an event, or must survive a restart" (ADR 0101). A workflow is a class
whose public async methods are its steps; the native engine runs them in process, records every run and step in a
durable journal, parks a run on a signal wait, retries with backoff, times out steps and runs, and undoes the completed
steps last first when one fails (ADR 0102, 0151, 0152, 0292).

**Tier:** `tier:lib` (`packages/runtime/workflow`). Entries `.`, `./node` and `./testing`. Depends on
`@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`,
`@stackra/errors`, `@stackra/events`, `@stackra/locking`, `@stackra/queue`, `@stackra/validation` and zod.

## What is here

| Symbol                                                               | Entry       | Use                                                                          |
| -------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `Workflow`                                                           | `.`         | `extends Workflow<Input>({ timeout })` or `Workflow({ startOn, correlate })` |
| `Signal`                                                             | `.`         | `extends Signal`: a fact sent into a parked run                              |
| `Step`                                                               | `.`         | `@Step({ after, when, heartbeat, retry, waitFor, correlate, timeout })`      |
| `Run`, `StepContext`                                                 | `.`         | the first two parameters of a step                                           |
| `StepStatus`, `WorkflowRunStatus`                                    | `.`         | the journal's status codes                                                   |
| `NativeWorkflowRunnerDriver`                                         | `.`         | the engine, and the `WorkflowRunner` behind `ctx.run` and `ctx.signal`       |
| `WorkflowJournal`, `MemoryWorkflowJournalDriver`                     | `.`         | the journal port and the memory journal                                      |
| `WorkflowConfig`, `WorkflowConfig$`, `WorkflowEngineOptions`         | `.`         | key `workflow`: `journal` (`postgres` default, `memory`)                     |
| `registerWorkflows`                                                  | `.`         | gen's entry registers each workflow's and signal's locked key                |
| `WorkflowRun`, `WorkflowStepRecord`, `HeldSignal`, `RunOrigin`, …    | `.`         | the journal's records                                                        |
| `PostgresWorkflowJournalDriver`                                      | `./node`    | the durable journal: `workflow.runs`, `workflow.steps`, `workflow.signals`   |
| `WorkflowExplorer`                                                   | `./node`    | at boot: connects the engine, checks every plan, subscribes `startOn`        |
| `WORKFLOW_TESTING_PLUGIN`, `runWorkflow`, `signal`, `WorkflowResult` | `./testing` | the in-process test driver, `app.workflows.last(W)` and `.advanceClock(d)`   |

## Writing a workflow

```ts
export class RedeemPointsWorkflow extends Workflow<RedeemPointsInput>({ timeout: "20m" }) {
  async quote(run: Run<this>, ctx: StepContext): Promise<QuotedRedemption> { ... }

  async debit(run: Run<this>, ctx: StepContext): Promise<number> {
    ctx.record(PointsRedeemed.create({ ... })); // leaves when this step commits
    return this.loyalty.redeem(run.results.quote.memberId, run.results.quote.points);
  }

  async undoDebit(run: Run<this>, ctx: StepContext): Promise<void> { ... } // compensates `debit`

  @Step<RedeemPointsWorkflow>({
    waitFor: RedemptionConfirmed,
    correlate: (run) => ({ memberId: run.results.quote.memberId, reference: run.results.quote.reference }),
    timeout: "15m",
  })
  async confirm(_run: Run<this>, _ctx: StepContext, confirmed: RedemptionConfirmed): Promise<RedemptionConfirmed> {
    return confirmed;
  }

  output(run: Run<this>): RedeemPointsOutput { ... }
}
```

An action starts it with `ctx.run(RedeemPointsWorkflow, input)`; another action wakes it with
`ctx.signal(RedemptionConfirmed, payload, correlation)`.

- **Steps** are every method other than `output` and `undo<Step>`, ancestors' first, in declaration order; `after`
  moves a step behind the steps it names. A step is idempotent on the run (`ctx.stepKey` is the same on every attempt).
- **Each step is a transaction of its own**, which also writes the step's journal row, so a run's steps commit whatever
  the calling action does. Results are stored as JSON: a later step reads `run.results.<step>` as plain data (a `Date`
  comes back as its ISO text).
- **Retries**: `retry: { attempts, backoff }`. A refusal that is not retryable fails the step at once; any other error
  takes the next attempt after the backoff, unless the run timeout would pass first. A retry waits in process.
- **Compensation**: when a step fails or times out, every done step with an `undo<Step>` is undone, last first, each in
  its own transaction; the run ends `compensated` and `ctx.run` rejects with the step's error (`workflow_timed_out` for a
  timeout). An undo that throws leaves the run `failed` for an operator.
- **Waits**: a `waitFor` step parks the run (`waiting`). `ctx.run` then resolves with `output(run)` over the results so
  far, so the action answers while the run waits durably. A signal is held in the sender's transaction, matched by
  signal, canonical correlation and scope, and taken by the next tick; one that arrives before the run parks, or before
  the wait times out however late the tick runs, still resumes it. Untaken signals are dropped after seven days.
- **Timeouts**: the run's `timeout` covers everything; a step's `timeout` bounds its wait, or aborts one attempt's
  `ctx.abortSignal`. `heartbeat` aborts a step that stops calling `ctx.heartbeat(progress)`; a retry reads
  `ctx.progress`.
- **Events**: `ctx.record(event)` writes an integration event to the outbox inside the step's transaction (through
  @stackra/events' `EventOutbox`, which @stackra/outbox implements) and dispatches a domain event in process after the
  commit. Events a model records leave through the outbox's flush writer. The event's metadata carries the starting
  caller, the call id as its correlation and the run's scope id in the envelope's scope field, never the `ScopeRef`.
- **Scope**: a run started by `ctx.run` keeps the call's `scope` in its origin, so each step reads `ctx.scope`; a run
  started without one (an event's `startOn`) takes the scope of the session it starts in.
- **`startOn`**: `Workflow({ startOn: PaymentCaptured, correlate: (event) => event.orderId })` starts a run on each
  event (the explorer subscribes it); a key that already has a run starts nothing.

## Running it

```ts
runner.connect(container); // WorkflowExplorer does this at boot
await runner.work({ signal: shutdown.signal }); // one worker loop per service: resumes, timeouts, take-overs
```

One runner advances a run at a time (`Locks`, key `workflow.run:<id>`); a run whose runner died is taken over by the
next tick once its lock frees.

## Tables

`workflow.runs`, `workflow.steps` and `workflow.signals` (migration `workflow.0001_create_runs`, with the `ltree`
extension). The worker advances every scope's runs, so no table has a row-level-security policy; a run's scope is data
(`scope_id`, `scope_path`) that the engine opens as the session of each step, and a signal is taken only by a run of
its own scope.

## Testing

```ts
const app = await createTestingModule(CommerceModule).useDrivers("memory").compile();
const { ok, run } = await runWorkflow(CreateOrderWorkflow, input, { as: actors.customer() });
await signal(RedemptionConfirmed, payload, correlation);
await app.workflows.advanceClock("16m");
expect((await app.workflows.last(RedeemPointsWorkflow)).status).toBe(WorkflowRunStatus.Compensated);
```

`advanceClock` moves the engine's time, not the app's `Clock`: a step reads the tick's instant from `ctx.now()`.

## Not here

- Staging a run's events until it succeeds (ADR 0102 decision 3): needs a staged state in @stackra/outbox.
- The run version pin (ADR 0152 decision 2): a resumed run runs the current code.
- Waiting for an event rather than a signal; workflow hooks (ADR 0102 decision 4); inspect, retry and cancel actions
  (ADR 0152 decision 4); the Temporal driver (Pro, ADR 0292).
