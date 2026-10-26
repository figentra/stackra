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
| `PublisherAccess`, `MemoryPublisherAccessDriver`, `AutomationPaused` | `.`         | an automation never exceeds its publisher; it pauses when access is lost     |
| `ServiceAcked`, `AllServicesAcked`                                   | `.`         | the cross-service "service acked" contract and the await-all signal          |
| `ServiceAckSet`, `ServiceAckService`                                 | `./node`    | the acks a workflow waits for on one subject                                 |
| `ChecklistTemplate$`, `ChecklistCustomization$`, `IndustryProfile$`  | `.`         | checklist templates, a scope's customization, industry profiles (seed data)  |
| `ChecklistAudience`, `checklistView`, `checkCustomization`, …        | `.`         | locked steps, scope and user progress, `ChecklistStepCompleted`/`Completed`  |
| `Checklist`, `ChecklistProgress`, `ChecklistService`                 | `./node`    | the checklist engine: seed, profile, customize, complete, view               |
| `runDocument`                                                        | `./testing` | runs an automation document or a plan in a test, through the app's pipeline  |

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
  the wait times out however late the tick runs, still resumes it. Untaken signals are dropped after
  `workflow.signalRetention` (`7d` by default, from `1m` to `90d`).
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
that version is deployed in a process, the run waits there. Keep the old class until its runs end. The kept class
lives beside the new one as `<name>.v<n>.workflow.ts` and is named `<Name>V<n>Workflow` (`redeem-points.v1.workflow.ts`
exports `RedeemPointsV1Workflow` with `version: 1` and the same `key`); the current class keeps the plain name.

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
- **For-each** (OS-232): a step with `"forEach": { "items": "input.buyers" }` calls its block once per item, in
  order, with `{ "$ref": "item" }` or `item.<path>` naming the current item; each call's id and Idempotency-Key is
  `<step key>:<index>`, and the step's result is the list of results. `checkAutomation` refuses `item` outside a
  for-each step and a list that names a later step. A list longer than `workflow.forEachLimit` (1,000 by default, up
  to 10,000), or a reference that names no list, fails the step with `for_each_items_invalid` (no retry). The dry run
  shows the first item's input and `iterations`.
- **Event chains** (OS-232): a document step's call id is its step key, so the events its block records carry the run
  as their correlation. When such an event triggers an automation, `runner.chained(correlationId, automationId)` reads
  the causing run's `chain` (kept in the run's input) and returns `{ depth, automations }` one deeper; the explorer
  passes it to `startDocument(…, { key, chain })`. A start deeper than `workflow.maxChainDepth` (3 by default, up to 20)
  or of an automation already in the chain (a loop) starts nothing and logs `workflow.chain_stopped`. A chain through
  another service's action keeps its depth only while that service propagates the call id as the correlation.
- **Run lifecycle**: every run records `WorkflowRunStarted` once its first row commits and `WorkflowRunEnded`
  (`completed`, `compensated`, `failed` or `cancelled`, with its error) once its last does: domain events on the bound
  `EventBus`, so a host's `Listener` records and meters runs (the OS ledger's `record_start` and `record_outcome`). A
  failing listener never fails the run. `startDocument(…, { automation })` keeps the automation id on the run
  (`WorkflowRun.automation`, column `automation_id`, migration `workflow.0007`); the explorer passes it for every
  triggered run, and `WorkflowJournal.byAutomation(automationId, limit, before?)` lists its runs newest first.
- **Cancel**: `runner.cancel(runId, reason?)` ends a running or waiting run `cancelled` (error `workflow_cancelled`
  with the reason) under the run's lock, so a step in flight finishes first; it is never advanced again, its done
  steps stay done and nothing is undone. It returns `false` for an unknown, ended or compensating run. The calling
  action carries the risk (ADR 0152 decision 4: cancel is L4); a bulk cancel is a loop over `byAutomation`.
- **Pause**: `AutomationService.pause(automationId, reason)` stops triggers from starting an automation for a host's
  snake_case reason (`failure_threshold`, `paused_by_user`) and records `AutomationPaused` with no blocks; it returns
  `false` when it was already paused. Publishing again resumes it.
- A product's seed pack ships default automations as a `WorkflowTemplatePack$` (`{ key, version, templates }`);
  `seedPack(scope, pack, principal)` publishes each as the product's seed principal, and a new version never
  overwrites a tenant's edit.

## Publisher access

An automation runs as its principal, and its grants are never more than its publisher's (ADR 0153 decision 2):

- `publish(id, revision, principal, publisher)` refuses `automation_exceeds_publisher` (403) when the publisher may not
  call an action block the revision calls, asked through the `PublisherAccess` port (@stackra/iam binds it).
- Before a trigger starts a published automation, the publisher's access is checked again. One that lost a block is
  paused (`pausedAt`, `pause_reason` `publisher_access_lost`, `AutomationPaused`) and starts nothing; publishing it
  again, by someone with access, resumes it. `recheck()` pauses the same way when a host learns a grant was revoked.
- A seed is published by its principal, the product's seed principal (ADR 0423).

## Service acks

A workflow that waits for several services (tenant provisioning, ADR 0210 decision 6):

```ts
async request(run: Run<this>, ctx: StepContext): Promise<boolean> {
  ctx.record(ProvisioningRequested.create({ tenantId: run.input.tenantId }));
  return this.acks.expect(run.input.tenantId, this.config.services); // true: nothing to wait for
}

@Step<ProvisionTenantWorkflow>({
  waitFor: AllServicesAcked,
  correlate: (run) => ({ subject: run.input.tenantId }),
  when: (run) => !run.results.request,
  timeout: "1h",
})
async provisioned(_run: Run<this>, _ctx: StepContext, acked: AllServicesAcked): Promise<string[]> {
  return acked.services;
}
```

Each service records `ServiceAcked.create({ subject, service })` when its part is done. The waiting service's explorer
hands each one to `ServiceAckService.ack`, and the ack that completes the set holds `AllServicesAcked` for the subject.
Call `expect` in the step that sends the request, so no ack can come first. `ServiceAcked` is the cross-service
contract (an integration event named `service.acked`, its wire name derived by gen): the acking service imports it from
`@stackra/workflow`, records it in the transaction that did its part, and needs nothing else of this package.

## Checklists

Onboarding (and exit or fix-list) checklists are `checklist-template` seed records: `ChecklistTemplate$` documents keyed
`workflow-template:<product>:<name>`, each step a lang-key label, a `locked` flag and an audience (`scope` or `user`).

- `ChecklistService.seed(scope, template)` copies the template into the scope; a new version moves it forward and keeps
  the customization.
- `applyProfile(scope, profile)` applies an industry profile (`IndustryProfile$`, the `industry-template` record) at
  sign-up: unlocked steps hidden and reordered, never over a scope's own customization.
- `customize(id, { hidden, order })` refuses a locked step (`step_locked`): a scope never removes one.
- `complete(id, step, actor)` records progress once, for the scope or for the user, with `ChecklistStepCompleted`, and
  `ChecklistCompleted` when every visible step is done; `view(id, userId)` is what the console checklist renders.

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
const plan = await runDocument(COD_CONFIRMATION, { orderId: "ord_1" }, { as: principal }); // a document run
await signal(RedemptionConfirmed, payload, correlation);
await app.workflows.advanceClock("16m");
expect((await app.workflows.last(RedeemPointsWorkflow)).status).toBe(WorkflowRunStatus.Compensated);
```

`advanceClock` moves the engine's time, not the app's `Clock`: a step reads the tick's instant from `ctx.now()`.

## Not here

- Staging a run's events until it succeeds (ADR 0102 decision 3): needs a staged state in @stackra/outbox.
- Retry of a failed run, and the inspect, retry and cancel actions themselves (ADR 0152 decision 4): the engine has
  `find`, `byAutomation` and `cancel`; the host's actions call them. The Temporal driver (Pro, ADR 0292).
- The @stackra/iam `PublisherAccess` driver, and the console checklist component.
- The sandboxed code step (`@stackra/sandbox`, ADR 0154). The automation editor kernel is `@stackra/builder`'s.
