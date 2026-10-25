# @stackra/workflow

Stackra workflows: the answer to "this action crosses modules, calls an external system, must undo an earlier effect
when a later one fails, waits for a human or an event, or must survive a restart" (ADR 0101). A workflow is a class
whose public async methods are its steps; the native engine runs them in process, records every run and step in a
durable journal, parks a run on a signal wait, retries with backoff, times out steps and runs, and undoes the completed
steps last first when one fails (ADR 0102, 0151, 0152, 0292).

**Tier:** `tier:lib` (`packages/runtime/workflow`). Entries `.`, `./node` and `./testing`. Depends on
`@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/content`, `@stackra/contracts`,
`@stackra/database`, `@stackra/errors`, `@stackra/events`, `@stackra/locking`, `@stackra/model`, `@stackra/queue`,
`@stackra/rules`, `@stackra/validation` and zod.

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
| `registerBlocks`, `buildingBlocks`, `BlockKind`, `BuildingBlock`     | `.`         | the building-block registry every package adds its triggers and actions to   |
| `AutomationDocument$`, `checkAutomation`, `AutomationInvalidError`   | `.`         | the automation document kind (and an agent's plan): shape and registry check |
| `dryRun`, `DryRun`, `DryRunStep`, `DryRunOutcome`                    | `.`         | what each step would do on a sample input, calling nothing                   |
| `WorkflowTemplatePack$`, `SeedResult`                                | `.`         | default automations as a versioned seed document                             |
| `Automation`, `AutomationService`, `AutomationRevision`              | `./node`    | versioned automations: draft, dry run, publish as a principal, seed          |

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

## Versions

`Workflow({ version: 2 })` ships a changed graph as a new class under the same key. A run records the version it
started on (`workflow.runs.version`, migration `workflow.0002`) and resumes on that version's class; while no class of
that version is deployed in a process, the run waits there. Keep the old class until its runs end.

## Event waits

`@Step({ waitFor: OrderCollected, correlate: (run) => run.input.orderId })` parks on an event as on a signal. The event
must be a trigger building block with a `correlate`: the explorer holds each occurrence under that correlation, so an
event that arrives before the run parks still resumes it. Boot fails for a wait on an event no block correlates.

## Building blocks, automations and plans

Every package exposes its capabilities as building blocks (ADR 0153): trigger events and actions.

```ts
registerBlocks([
  {
    key: "orders.order_paid",
    kind: BlockKind.Trigger,
    type: OrderPaid,
    label: "orders::blocks.order_paid",
    facts: { total: { type: FieldType.Number, label: "orders::facts.total" } },
    correlate: (event: OrderPaid) => event.orderId,
  },
  {
    key: "notifications.send_sms",
    kind: BlockKind.Action,
    type: SendSmsAction,
    label: "notifications::blocks.sms",
  },
]);
```

An automation is a document that references blocks and adds no code (ADR 0122):

```json
{
  "key": "commerce.cod_confirmation",
  "trigger": { "block": "orders.order_paid" },
  "steps": [
    {
      "name": "ask",
      "block": "notifications.send_sms",
      "input": { "orderId": { "$ref": "input.orderId" } },
      "when": { "field": "trigger.total", "operator": "at_least", "value": 100 }
    },
    {
      "name": "confirm",
      "waitFor": { "block": "orders.cod_confirmed", "correlate": "input.orderId", "timeout": "2h" }
    }
  ]
}
```

- `checkAutomation` refuses an unregistered or wrong-kind block, a wait on a trigger that does not correlate, a
  reference that points forward (`results.<later step>`) or to `event.*` outside a waiting step, and a `when` that is
  not a `@stackra/rules` condition over the trigger's facts.
- `AutomationService`: `open`, `draft` (the document's version is the revision number), `dryRun` (records the
  revision), `publish(id, revision, principal)` (refuses `automation_not_dry_run`), `revision`, `triggered`, `seed`,
  `seedPack`. Table `workflow.automations` (migration `workflow.0003`), under forced row-level security.
- The explorer subscribes each trigger block: an occurrence starts each published automation of the delivery's scope
  as the automation's principal, keyed by automation and occurrence, so a redelivery starts nothing twice.
- `runner.startDocument(document, input, origin, { key })` runs a document: each step calls its action block through
  `ActionPipeline` as `origin.actor`, with its input's references resolved and the step key as the Idempotency-Key, so
  access, approval and audit apply to every step. An agent's plan is a document without a trigger, started the same
  way: an ephemeral workflow with no stored record (ADR 0245 decision 8). The run keeps the document, so it resumes on
  that version.
- A product's seed pack ships default automations as a `WorkflowTemplatePack$` (`{ key, version, templates }`);
  `seedPack(scope, pack, principal)` publishes each, and a new version never overwrites a tenant's edit.

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
- Workflow hooks (ADR 0102 decision 4); inspect, retry and cancel actions (ADR 0152 decision 4); the Temporal driver
  (Pro, ADR 0292).
- Pausing an automation when its publisher loses access, and the check that its grants never exceed the publisher's
  (ADR 0153 decision 2): the publishing action decides the principal it passes.
- The automation studio editor (`@stackra/builder`) and the sandboxed code step (`@stackra/sandbox`, ADR 0154).
