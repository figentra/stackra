/**
 * Stackra file contract:
 * Purpose: `NativeWorkflowRunnerDriver`, the native workflow engine and the `WorkflowRunner` behind `ctx.run` and
 *          `ctx.signal`: it runs a workflow's steps in process, each in a transaction of its own that also writes the
 *          step's journal row; parks a run before a step that waits for a signal and resumes it when the signal or the
 *          timeout comes; retries a step with backoff; times out steps and runs; and on a failure undoes the completed
 *          steps last first. `startDocument` runs an automation document or an agent's plan the same way, each step an
 *          action call through the pipeline as the run's principal (a for-each step one call per item); `chained`
 *          places a triggered run in its event chain and stops a chain past its depth or a cycle; `cancel` stops a
 *          running or waiting run. Every run announces its start (`WorkflowRunStarted`) and its end
 *          (`WorkflowRunEnded`). `tick` advances what is due (resumed waits, timeouts, runs whose runner died), each
 *          run on the version it started on; `work` ticks until stopped.
 * Boundary: over the `WorkflowJournal` port (Postgres or memory), `Locks` (one runner per run, so a run never advances
 *           twice at once) and the `Clock`; `connect(resolver)` gives it the container that builds workflow instances
 *           and binds `EventOutbox`, `EventBus` and `ContextStorage` (the explorer connects it at boot, the testing
 *           plugin in a test). `run` resolves to the workflow's `output(run)` once the run completes, or once it parks
 *           on a wait (over the results so far, so the calling action answers while the run waits durably), and rejects
 *           with the failing step's error (`workflow_timed_out` for a timeout) after compensating. A sent signal is
 *           held in the sender's transaction and taken by the next tick, never by the sender's call. A step's
 *           integration events go to the outbox in the step's transaction and its domain events to the bus after it
 *           commits, with the run's scope id as the envelope's scope field and no `scope` key; events a model records
 *           reach the outbox through its own flush. Staging the events of a whole run until it succeeds (ADR 0102
 *           decision 3) waits for a staged state in @stackra/outbox. A document run keeps its document in its input, so
 *           it resumes on that version; a coded run resumes on the class registered for its key and version, and waits
 *           (not advanced here) while no such class is deployed in this process. A step may wait for an event as for a
 *           signal: the explorer holds each occurrence of a correlating trigger block. A document step's call id is its
 *           step key, so the events its block records name the run as their correlation; a trigger that event fires
 *           reads the run's chain from it. A for-each step calls its block one item after another in one attempt, each
 *           call keyed `<step key>:<index>` so a retried attempt replays the calls an idempotent action already made. A
 *           document run of a stored automation keeps its id (`WorkflowRun.automation`) so the journal lists an
 *           automation's runs. The lifecycle events are domain events on the bound `EventBus`, dispatched after the row
 *           commits; the bus records a failing listener and the run never sees it.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decisions 1, 2 and 7); ADR 0151 (decisions 2 and 3: the native driver behind the
 *                     engine port, which is @stackra/actions' `WorkflowRunner`); ADR 0292 (decision 2); ADR 0152 (0294
 *                     note: waits, timeouts, heartbeats, held signals; decisions 1, 2 and 5: event waits, the version
 *                     pin, one graph format); ADR 0101 (0294 note: `ctx.run`); ADR 0149 (locks); ADR 0122 (decision
 *                     3); ADR 0153 (decision 2: an automation runs as its principal); ADR 0245 (decision 8: a plan is
 *                     an ephemeral workflow); OS-232 (for-each and chain depth, both configured); ADR 0141
 *                     (correlation).
 */
import { ActionPipeline } from "@stackra/actions";
import type { ExtensionContext, Resolver } from "@stackra/actions";
import { ContextStorage, WorkflowRunner } from "@stackra/actions/contracts";
import type { CallDescriptor } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Duration, Logger } from "@stackra/contracts";
import type { Clock, Json, PublicId } from "@stackra/contracts";
import { isRefusal, WorkflowTimedOutError } from "@stackra/errors";
import { EventBus } from "@stackra/events";
import type { Event } from "@stackra/events";
import { EventOutbox } from "@stackra/events/contracts";
import type { EventMeta, RecordedEvent } from "@stackra/events/contracts";
import type { Locks } from "@stackra/locking";
import { backoffDelay } from "@stackra/queue";
import { duration } from "@stackra/validation";

import type { WorkflowConfig } from "#config/workflow.config";
import { BUILDING_BLOCKS } from "#core/constants/building-blocks.constant";
import { DOCUMENT_WORKFLOW } from "#core/constants/document-workflow.constant";
import { WORKFLOW_DEFAULTS } from "#core/constants/workflow-defaults.constant";
import { WORKFLOW_KEYS } from "#core/constants/workflow-keys.constant";
import { StepStatus } from "#core/enums/step-status.enum";
import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import { ForEachItemsInvalidError } from "#core/errors/for-each-items-invalid.error";
import { WorkflowRunEnded } from "#core/events/workflow-run-ended.event";
import { WorkflowRunStarted } from "#core/events/workflow-run-started.event";
import { checkAutomation } from "#core/functions/check-automation.function";
import { correlationKey } from "#core/functions/correlation-key.function";
import { documentPlan } from "#core/functions/document-plan.function";
import { lookupRef } from "#core/functions/lookup-ref.function";
import { mintId } from "#core/functions/mint-id.function";
import { planOf } from "#core/functions/plan-of.function";
import { resolveRefs } from "#core/functions/resolve-refs.function";
import { runOfCall } from "#core/functions/run-of-call.function";
import { workflowKey } from "#core/functions/workflow-key.function";
import type { WorkflowJournal } from "#core/ports/workflow-journal.port";
import type { AutomationDocument } from "#core/types/automation-document.type";
import type { AutomationStep } from "#core/types/automation-step.type";
import type { DocumentInput } from "#core/types/document-input.type";
import type { DocumentRoots } from "#core/types/document-roots.type";
import type { DocumentView } from "#core/types/document-view.type";
import type { RunChain } from "#core/types/run-chain.type";
import type { RunOrigin } from "#core/types/run-origin.type";
import type { StepContext } from "#core/types/step-context.type";
import type { StepPlan } from "#core/types/step-plan.type";
import type { WorkflowError } from "#core/types/workflow-error.type";
import type { WorkflowPlan } from "#core/types/workflow-plan.type";
import type { WorkflowRun } from "#core/types/workflow-run.type";
import type { WorkflowStepRecord } from "#core/types/workflow-step-record.type";

/** How one attempt of a step ended. */
type Attempt =
  | { readonly kind: "done"; readonly run: WorkflowRun }
  | { readonly kind: "parked" }
  | { readonly kind: "failed"; readonly run: WorkflowRun; readonly error: unknown };

/** How an advance ended: where the run stands, and, when it compensated or failed, the error a caller refuses with. */
interface Outcome {
  readonly run: WorkflowRun;
  readonly failed: boolean;
  readonly error?: unknown;
}

/** What a waiting step waits on, and the latest arrival that still counts. */
interface Wait {
  readonly signal: string;
  readonly correlation: string;
  readonly wakeAt?: Date;
  readonly before: Date;
}

/** An attempt's abort signal, with its heartbeat watchdog. */
interface Guard {
  readonly signal: AbortSignal;
  beat(): void;
  stop(): void;
}

/** The step record an attempt keeps up to date between its tries and heartbeats. */
interface Latest {
  record: WorkflowStepRecord | undefined;
}

/** What a run advances on: its plan and the instance whose methods are its steps. */
interface Target {
  readonly plan: WorkflowPlan;
  readonly instance: object;
}

/** The class kinds `hold` takes: a signal, or an event a step waits for. */
const HOLDABLE: readonly string[] = ["signal", "domain_event", "integration_event"];

/** The run statuses a tick advances. */
const ACTIVE: readonly WorkflowRunStatus[] = [
  WorkflowRunStatus.Running,
  WorkflowRunStatus.Waiting,
  WorkflowRunStatus.Compensating,
];

/** The guard of an undo: never aborted, no watchdog. */
const IDLE: Guard = Object.freeze({
  signal: new AbortController().signal,
  beat: () => undefined,
  stop: () => undefined,
});

/** The lock that keeps one runner per run. */
const lockKey = (id: PublicId<"wfr">): string => `workflow.run:${id}`;

/** `at` plus `milliseconds`. */
const later = (at: Date, milliseconds: number): Date => new Date(at.getTime() + milliseconds);

/** `value` as the journal stores it: JSON, `undefined` kept as absent. */
const toJson = (value: unknown): unknown =>
  value === undefined ? undefined : (JSON.parse(JSON.stringify(value)) as unknown);

/** How `error` is recorded. */
const errorOf = (error: unknown): WorkflowError => ({
  code: isRefusal(error) ? error.code : "internal",
  message: error instanceof Error ? error.message : String(error),
});

/** Whether another attempt may succeed: any error but a refusal that says it will not. */
const retryable = (error: unknown): boolean => (isRefusal(error) ? error.retryable : true);

/** Whether `event` leaves the service through the outbox. */
const isIntegration = (event: Event): boolean =>
  kindOf(event.constructor)?.kind === "integration_event";

/** The record of step `name` in `run`. */
const recordOf = (run: WorkflowRun, name: string): WorkflowStepRecord | undefined =>
  run.steps.find((step) => step.name === name);

/** `run` with `step` in place of its record of the same name, else appended. */
function withStep(run: WorkflowRun, step: WorkflowStepRecord): WorkflowRun {
  const steps = run.steps.some((known) => known.name === step.name)
    ? run.steps.map((known) => (known.name === step.name ? step : known))
    : [...run.steps, step];
  return Object.freeze({ ...run, steps: Object.freeze(steps) });
}

/** `run` as a step sees it (`Run<W>`): its id, input and the results kept so far, and when it started. */
function viewOf(run: WorkflowRun): object {
  const results = Object.fromEntries(
    run.steps.filter((step) => "result" in step).map((step) => [step.name, step.result]),
  );
  return Object.freeze({
    id: run.id,
    input: run.input,
    results: Object.freeze(results),
    startedAt: run.startedAt,
  });
}

/** An instance of `type` built from a held payload, as `Event.create` builds an event: no constructor runs. */
const signalOf = (type: AnyClass, payload: object): object =>
  Object.freeze(Object.assign(Object.create(type.prototype as object) as object, payload));

/**
 * Calls `method` of `instance` with `args`.
 *
 * @throws TypeError when the instance has no such method.
 */
function invoke(instance: object, method: string, args: readonly unknown[]): unknown {
  const body = (instance as Readonly<Record<string, unknown>>)[method];
  if (typeof body !== "function")
    throw new TypeError(`${instance.constructor.name} has no method ${method}`);
  return (body as (...rest: readonly unknown[]) => unknown).call(instance, ...args);
}

/** The guard of one attempt of `step`: its timeout (without a wait) and its heartbeat watchdog abort it. */
function guardOf(step: StepPlan): Guard {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const beat = (): void => {
    clearTimeout(timer);
    if (step.heartbeat !== undefined)
      timer = setTimeout(
        () => controller.abort(new Error(`${step.name} missed its heartbeat`)),
        step.heartbeat,
      );
  };
  beat();
  const signal =
    step.timeout === undefined || step.waitFor !== undefined
      ? controller.signal
      : AbortSignal.any([controller.signal, AbortSignal.timeout(step.timeout)]);
  return { signal, beat, stop: () => clearTimeout(timer) };
}

/** Resolves after the idle poll, or at once when `signal` aborts. */
function pause(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, WORKFLOW_DEFAULTS.pollMilliseconds);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/**
 * Runs workflows in this process, keeping each run, step and held signal in the journal.
 *
 * @example
 * // generated wiring: { port: WorkflowRunner, candidates: { native: () => import("@stackra/workflow").then((m) => m.NativeWorkflowRunnerDriver) } }
 * runner.connect(container);
 * const output = await runner.start(CreateOrderWorkflow, input, origin);
 * await runner.work({ signal: shutdown.signal });
 */
export class NativeWorkflowRunnerDriver extends Driver(WorkflowRunner) {
  /** Where runs, steps and held signals are kept. */
  private readonly journal: WorkflowJournal;

  /** One runner per run. */
  private readonly locks: Locks;

  /** Every time the engine stores. */
  private readonly clock: Clock;

  /** How long an untaken signal is held, in milliseconds (config `workflow.signalRetention`). */
  private readonly signalRetention: number;

  /** The most items a for-each step takes (config `workflow.forEachLimit`). */
  private readonly forEachLimit: number;

  /** How deep an event chain of triggered runs may grow (config `workflow.maxChainDepth`). */
  private readonly maxChainDepth: number;

  /** Set by `connect`. */
  private resolver: Resolver | undefined;

  /**
   * @param journal - the store config `workflow.journal` picks.
   * @param locks - the run locks.
   * @param clock - the time source.
   * @param config - the bound configuration; without one a signal is held for the default seven days, a for-each
   *                 step takes 1,000 items and a chain grows 3 runs deep.
   */
  constructor(journal: WorkflowJournal, locks: Locks, clock: Clock, config?: WorkflowConfig) {
    super();
    this.journal = journal;
    this.locks = locks;
    this.clock = clock;
    this.signalRetention =
      config === undefined
        ? WORKFLOW_DEFAULTS.signalHoldMilliseconds
        : Duration.toMilliseconds(duration(config.signalRetention));
    this.forEachLimit = config?.forEachLimit ?? WORKFLOW_DEFAULTS.forEachLimit;
    this.maxChainDepth = config?.maxChainDepth ?? WORKFLOW_DEFAULTS.maxChainDepth;
  }

  /** Builds workflows and reads the event and context ports from `resolver`; a later call replaces it. */
  connect(resolver: Resolver): void {
    this.resolver = resolver;
  }

  /** See `WorkflowRunner.run`: starts `workflow` on behalf of `call`. */
  run(workflow: AnyClass, input: unknown, call: CallDescriptor): Promise<unknown> {
    return this.start(workflow, input, this.originOf(call));
  }

  /** See `WorkflowRunner.signal`: holds the signal for the run that waits on it. */
  signal(
    signal: AnyClass,
    payload: object,
    correlation: object | undefined,
    _call: CallDescriptor,
  ): Promise<void> {
    return this.hold(signal, payload, correlation);
  }

  /**
   * Starts a run of `workflow` with `input` as `origin` and advances it until it completes, parks or compensates.
   * A `startOn` workflow keys the run by its correlation, so a second start of the same key starts nothing. An origin
   * without a `scope` takes the caller's session scope, so its steps read it as `ctx.scope`.
   *
   * @returns `output(run)` over the results so far (`undefined` without an `output` method, or for a key that already
   *          has a run).
   * @throws the failing step's error, or `WorkflowTimedOutError`, once the completed steps were undone.
   * @throws TypeError when `workflow` is not a workflow or its plan is invalid; Error before `connect`.
   */
  async start(workflow: AnyClass, input: unknown, origin: RunOrigin): Promise<unknown> {
    const plan = planOf(workflow);
    const instance = this.instanceOf(workflow);
    const key =
      plan.correlate === undefined
        ? undefined
        : `${plan.key}:${correlationKey(plan.correlate(input as never))}`;
    const outcome = await this.launch(plan, instance, toJson(input), origin, key, undefined);
    if (outcome === undefined) return undefined;
    return typeof (instance as { output?: unknown }).output === "function"
      ? invoke(instance, "output", [viewOf(outcome.run)])
      : undefined;
  }

  /**
   * Starts a run of an automation document or an agent's plan with `input` as `origin` (the automation's principal,
   * or the user who approved the plan) and advances it until it completes, parks or compensates. Each step calls its
   * action block through the action pipeline as that caller, so access, approval and audit apply to every step. The
   * run keeps the document, so it resumes on this version. Given `options.key`, a second start of the same key starts
   * nothing (a redelivered trigger); `options.chain` (from `chained`) is kept with the run, so the runs its events
   * trigger continue the chain; `options.automation` names the stored automation the run runs, so the journal lists it
   * (`WorkflowJournal.byAutomation`) and the lifecycle events carry it.
   *
   * @returns the run's id; `undefined` for a key that already has a run.
   * @throws AutomationInvalidError when the document does not check; the failing step's error, or
   *         `WorkflowTimedOutError`, once the completed steps were undone; Error before `connect`.
   */
  async startDocument(
    document: unknown,
    input: unknown,
    origin: RunOrigin,
    options: {
      readonly key?: string;
      readonly chain?: RunChain;
      readonly automation?: PublicId<"wfa">;
    } = {},
  ): Promise<PublicId<"wfr"> | undefined> {
    const checked = checkAutomation(document);
    this.connected();
    const run: DocumentInput = {
      document: checked,
      input: toJson(input),
      ...(options.chain === undefined ? {} : { chain: options.chain }),
    };
    const outcome = await this.launch(
      documentPlan(checked),
      this.documentInstance(checked),
      run,
      origin,
      options.key === undefined ? undefined : `${DOCUMENT_WORKFLOW}:${options.key}`,
      options.automation,
    );
    return outcome?.run.id;
  }

  /**
   * Holds `payload` as a `signal` (or an awaited event) sent with `correlation`, in the caller's transaction, for the
   * run of the caller's scope that waits on both; the next tick resumes that run.
   *
   * @throws TypeError when `signal` is neither a signal class nor an event class.
   */
  async hold(signal: AnyClass, payload: object, correlation?: string | object): Promise<void> {
    if (!HOLDABLE.includes(kindOf(signal)?.kind ?? ""))
      throw new TypeError(`${signal.name} is not a signal: extend Signal`);
    const receivedAt = this.clock.now();
    const scope = await this.journal.currentScope();
    await this.journal.hold({
      id: await mintId("wfs"),
      signal: workflowKey(signal),
      correlation: correlationKey(correlation),
      payload: toJson(payload) as object,
      ...(scope === undefined ? {} : { scope }),
      receivedAt,
      expiresAt: later(receivedAt, this.signalRetention),
    });
  }

  /**
   * The chain a run of automation `automationId` joins when an event with `correlationId` triggers it: depth 1 for an
   * event no document run caused, else the causing run's chain plus this automation. A chain past
   * `workflow.maxChainDepth`, or one this automation is already in (a loop), is stopped and logged.
   *
   * @returns the chain to start with (`startDocument`'s `options.chain`); `undefined` when the run must not start.
   */
  async chained(
    correlationId: string | undefined,
    automationId: string,
  ): Promise<RunChain | undefined> {
    const cause = runOfCall(correlationId);
    const parent = cause === undefined ? undefined : await this.journal.find(cause);
    const before =
      parent?.workflow === DOCUMENT_WORKFLOW
        ? ((parent.input as DocumentInput).chain ?? { depth: 1, automations: [] })
        : undefined;
    const chain: RunChain = Object.freeze({
      depth: (before?.depth ?? 0) + 1,
      automations: Object.freeze([...(before?.automations ?? []), automationId]),
    });
    if (chain.depth <= this.maxChainDepth && before?.automations.includes(automationId) !== true)
      return chain;
    this.optional(Logger)?.warn(WORKFLOW_DEFAULTS.chainStopped, {
      automationId,
      depth: chain.depth,
      limit: this.maxChainDepth,
      ...(cause === undefined ? {} : { cause }),
    });
    return undefined;
  }

  /**
   * Cancels run `id` (ADR 0152 decision 4: an operation, the calling action's risk): a running or waiting run ends
   * `cancelled` with `workflow_cancelled` and `reason`, and is never advanced again; its done steps stay done and
   * nothing is undone. It waits for the run's lock, so a step in flight finishes first.
   *
   * @returns whether it cancelled; `false` for an unknown run or one that already ended or is compensating.
   */
  async cancel(id: PublicId<"wfr">, reason = "Cancelled"): Promise<boolean> {
    return this.locks.with(lockKey(id), WORKFLOW_DEFAULTS.lease, async () => {
      const run = await this.journal.find(id);
      if (
        run === undefined ||
        (run.status !== WorkflowRunStatus.Running && run.status !== WorkflowRunStatus.Waiting)
      )
        return false;
      await this.end({
        ...run,
        status: WorkflowRunStatus.Cancelled,
        error: { code: WORKFLOW_DEFAULTS.cancelled, message: reason },
        endedAt: this.clock.now(),
      });
      return true;
    });
  }

  /** The latest run of `workflow`, for inspection (ADR 0152 decision 4). */
  last(workflow: AnyClass): Promise<WorkflowRun | undefined> {
    return this.journal.last(workflowKey(workflow));
  }

  /** Run `id`, for inspection. */
  find(id: PublicId<"wfr">): Promise<WorkflowRun | undefined> {
    return this.journal.find(id);
  }

  /**
   * Drops lapsed signals, then advances each due run whose lock is free: a wait whose signal came or whose time
   * passed, a run past its timeout, and a running or compensating run whose runner died.
   *
   * @param now - the instant the tick acts at; the clock's when absent.
   * @returns how many runs it advanced.
   */
  async tick(now: Date = this.clock.now()): Promise<number> {
    await this.journal.transaction(undefined, () => this.journal.expire(now));
    let advanced = 0;
    for (const id of await this.journal.due(now, WORKFLOW_DEFAULTS.batch))
      // oxlint-disable-next-line no-await-in-loop -- one run at a time, each under its own lock
      if (await this.resume(id, now)) advanced += 1;
    return advanced;
  }

  /** Ticks until `signal` aborts, pausing after a tick that advanced nothing; a failed tick is logged and paused. */
  async work(options: { readonly signal: AbortSignal }): Promise<void> {
    while (!options.signal.aborted)
      try {
        // oxlint-disable-next-line no-await-in-loop -- one tick at a time
        if ((await this.tick()) === 0) await pause(options.signal);
      } catch (cause) {
        this.optional(Logger)?.error(WORKFLOW_DEFAULTS.tickFailed, { cause });
        // oxlint-disable-next-line no-await-in-loop -- see above
        await pause(options.signal);
      }
  }

  /**
   * Saves a new run of `plan` with `input` (of `automation`, when given), announces it and advances it; with `key`, the
   * run's id is derived from it and a key that already has a run starts nothing. An origin without a `scope` takes the
   * caller's session scope.
   *
   * @throws the failing step's error once the completed steps were undone.
   */
  private async launch(
    plan: WorkflowPlan,
    instance: object,
    input: unknown,
    origin: RunOrigin,
    key: string | undefined,
    automation: PublicId<"wfa"> | undefined,
  ): Promise<Outcome | undefined> {
    const id = await mintId("wfr", key);
    const scope = await this.journal.currentScope();
    return this.locks.with(lockKey(id), WORKFLOW_DEFAULTS.lease, async () => {
      if (key !== undefined && (await this.journal.find(id)) !== undefined) return undefined;
      const startedAt = this.clock.now();
      const run = await this.save(
        Object.freeze({
          id,
          workflow: plan.key,
          version: plan.version,
          ...(automation === undefined ? {} : { automation }),
          status: WorkflowRunStatus.Running,
          input,
          // A run an event starts has no call scope: its steps run in, and read, the session's.
          origin:
            origin.scope === undefined && scope !== undefined
              ? Object.freeze({ ...origin, scope })
              : origin,
          ...(scope === undefined ? {} : { scope }),
          startedAt,
          ...(plan.timeout === undefined ? {} : { deadlineAt: later(startedAt, plan.timeout) }),
          steps: Object.freeze([]),
        }),
      );
      await this.publish(
        [
          WorkflowRunStarted.create({
            runId: run.id,
            workflow: run.workflow,
            version: run.version ?? 1,
            ...(automation === undefined ? {} : { automationId: automation }),
          }),
        ],
        run,
        startedAt,
      );
      const outcome = await this.advance(run, instance, plan, startedAt);
      if (outcome.failed) throw outcome.error;
      return outcome;
    });
  }

  /** Advances run `id` when its lock is free and its workflow version is known here; `true` when it did. */
  private async resume(id: PublicId<"wfr">, now: Date): Promise<boolean> {
    let advanced = false;
    await this.locks.tryWith(lockKey(id), WORKFLOW_DEFAULTS.lease, async () => {
      const run = await this.journal.find(id);
      if (run === undefined || !ACTIVE.includes(run.status)) return;
      const target = this.targetOf(run);
      if (target === undefined) return;
      await this.advance(run, target.instance, target.plan, now);
      advanced = true;
    });
    return advanced;
  }

  /**
   * What `run` advances on: the document it carries, or the class registered for its key and pinned version;
   * `undefined` when this process cannot run it (that version, or a block it names, is not deployed here).
   */
  private targetOf(run: WorkflowRun): Target | undefined {
    if (run.workflow === DOCUMENT_WORKFLOW) {
      const { document } = run.input as DocumentInput;
      const keys = [
        document.trigger?.block,
        ...document.steps.flatMap((step) => [step.block, step.waitFor?.block]),
      ];
      if (!keys.every((key) => key === undefined || BUILDING_BLOCKS.has(key))) return undefined;
      return { plan: documentPlan(document), instance: this.documentInstance(document) };
    }
    const type = WORKFLOW_KEYS.versions.get(`${run.workflow}@${run.version ?? 1}`);
    return type === undefined ? undefined : { plan: planOf(type), instance: this.instanceOf(type) };
  }

  /** The object whose methods are `document`'s steps, each calling its block (or handing on what it waited for). */
  private documentInstance(document: AutomationDocument): object {
    return Object.freeze(
      Object.fromEntries(
        document.steps.map((step) => [
          step.name,
          (view: DocumentView, ctx: StepContext, received?: object) =>
            this.perform(step, view, ctx, received),
        ]),
      ),
    );
  }

  /**
   * One document step: calls its action block through the action pipeline as the run's caller, in the run's scope,
   * with its input's references resolved and the step key as the call's id and idempotency key; a wait-only step
   * returns the occurrence it received. A for-each step calls its block once per item of its list, in order, the
   * item as the `item` root and `<step key>:<index>` as each call's key, and returns the results in item order.
   *
   * @throws ForEachItemsInvalidError when a for-each list is not a list or is longer than `workflow.forEachLimit`.
   */
  private async perform(
    step: AutomationStep,
    view: DocumentView,
    ctx: StepContext,
    received: object | undefined,
  ): Promise<unknown> {
    if (step.block === undefined) return toJson(received);
    // reason: the plan was built only when every block of the document is registered here
    const block = BUILDING_BLOCKS.get(step.block) as { readonly type: AnyClass };
    const roots: DocumentRoots = {
      input: view.input.input,
      results: view.results,
      ...(received === undefined ? {} : { event: toJson(received) }),
    };
    const resolver = this.connected();
    const pipeline = resolver.has(ActionPipeline)
      ? resolver.get(ActionPipeline)
      : new ActionPipeline(resolver);
    const call = (scope: DocumentRoots, key: string): Promise<unknown> =>
      pipeline.execute(block.type as never, resolveRefs(step.input, scope) as never, {
        actor: ctx.actor,
        ...(ctx.scope === undefined ? {} : { scope: ctx.scope }),
        callId: key,
        idempotencyKey: key,
        locale: ctx.locale,
        timeZone: ctx.timeZone,
        currency: ctx.currency,
        market: ctx.market,
        abortSignal: ctx.abortSignal,
      });
    if (step.forEach === undefined) return call(roots, ctx.stepKey);
    const items = lookupRef(step.forEach.items, roots);
    if (!Array.isArray(items) || items.length > this.forEachLimit)
      throw ForEachItemsInvalidError.create({
        step: step.name,
        ...(Array.isArray(items) ? { count: items.length } : {}),
        limit: this.forEachLimit,
      });
    const results: unknown[] = [];
    for (const [index, item] of items.entries())
      // oxlint-disable-next-line no-await-in-loop -- items run one after another, in list order
      results.push(toJson(await call({ ...roots, item }, `${ctx.stepKey}:${index}`)) ?? null);
    return results;
  }

  /** Runs the steps of `start` that are not done, in plan order, until the run completes, parks or compensates. */
  private async advance(
    start: WorkflowRun,
    instance: object,
    plan: WorkflowPlan,
    now: Date,
  ): Promise<Outcome> {
    if (start.status === WorkflowRunStatus.Compensating)
      return this.compensate(start, instance, plan, now);
    let run = start;
    for (const step of plan.steps) {
      const at = this.instant(now);
      const record = recordOf(run, step.name);
      if (record?.status === StepStatus.Done || record?.status === StepStatus.Skipped) continue;
      if (run.deadlineAt !== undefined && at.getTime() >= run.deadlineAt.getTime())
        return this.timeOut(run, instance, plan, step, record, at);
      if (step.when !== undefined && !step.when(viewOf(run) as never)) {
        // oxlint-disable-next-line no-await-in-loop -- steps run one after another
        run = await this.save(
          withStep(run, {
            name: step.name,
            status: StepStatus.Skipped,
            attempts: 0,
            startedAt: at,
            endedAt: at,
          }),
        );
        continue;
      }
      const wait = this.waitOf(run, step, record, at);
      // oxlint-disable-next-line no-await-in-loop -- see above
      let attempt = await this.attempt(run, instance, step, record, at, wait);
      if (attempt.kind === "parked" && wait !== undefined) {
        if (wait.wakeAt !== undefined && at.getTime() >= wait.wakeAt.getTime())
          return this.timeOut(run, instance, plan, step, record, at);
        if (record?.status === StepStatus.Waiting) return { run, failed: false };
        // oxlint-disable-next-line no-await-in-loop -- parks, then looks once more for a signal sent meanwhile
        run = await this.save({
          ...withStep(run, {
            name: step.name,
            status: StepStatus.Waiting,
            attempts: record?.attempts ?? 0,
            signal: wait.signal,
            correlation: wait.correlation,
            ...(wait.wakeAt === undefined ? {} : { wakeAt: wait.wakeAt }),
            startedAt: at,
          }),
          status: WorkflowRunStatus.Waiting,
        });
        // oxlint-disable-next-line no-await-in-loop -- see above
        attempt = await this.attempt(run, instance, step, recordOf(run, step.name), at, wait);
      }
      if (attempt.kind === "failed")
        return this.fail(attempt.run, instance, plan, attempt.error, at);
      if (attempt.kind === "parked") return { run, failed: false };
      run = attempt.run;
    }
    const endedAt = this.instant(now);
    return {
      run: await this.end({ ...run, status: WorkflowRunStatus.Completed, endedAt }),
      failed: false,
    };
  }

  /** What `step` waits on in `run`, or `undefined` for a step without `waitFor`. */
  private waitOf(
    run: WorkflowRun,
    step: StepPlan,
    record: WorkflowStepRecord | undefined,
    now: Date,
  ): Wait | undefined {
    if (step.signal === undefined) return undefined;
    const wakeAt =
      record?.wakeAt ?? (step.timeout === undefined ? undefined : later(now, step.timeout));
    return {
      signal: step.signal,
      correlation: record?.correlation ?? correlationKey(step.correlate?.(viewOf(run) as never)),
      ...(wakeAt === undefined ? {} : { wakeAt }),
      // a signal that arrived before the wait timed out wins, however late the tick runs
      before: wakeAt !== undefined && wakeAt.getTime() < now.getTime() ? wakeAt : now,
    };
  }

  /**
   * Runs `step` until an attempt commits, its retries run out, or (for a waiting step) no signal is held. Each attempt
   * is one transaction: the held signal is taken, the body runs, its integration events are written and the step is
   * recorded done, or none of it happens.
   */
  private async attempt(
    start: WorkflowRun,
    instance: object,
    step: StepPlan,
    record: WorkflowStepRecord | undefined,
    now: Date,
    wait: Wait | undefined,
  ): Promise<Attempt> {
    let run = start;
    const latest: Latest = { record };
    const first = (record?.attempts ?? 0) + 1;
    let signal: object | undefined;
    for (let attempt = first; ; attempt += 1) {
      const at = attempt === first ? now : this.clock.now();
      const events: Event[] = [];
      const guard = guardOf(step);
      const current = run;
      try {
        // oxlint-disable-next-line no-await-in-loop -- one attempt at a time
        const done = await this.journal.transaction(current.scope, async () => {
          if (wait !== undefined && step.waitFor !== undefined) {
            const held = await this.journal.take(
              wait.signal,
              wait.correlation,
              current.scope,
              wait.before,
            );
            // a store without rollback lost the signal to a failed attempt; that attempt's signal stands
            if (held !== undefined) signal = signalOf(step.waitFor, held.payload);
            if (signal === undefined) return undefined;
          }
          const ctx = this.contextOf(current, step, step.name, attempt, at, events, guard, latest);
          const result = toJson(
            await this.within(ctx, () =>
              invoke(instance, step.name, [viewOf(current), ctx, signal]),
            ),
          );
          const progress = latest.record?.progress;
          const next: WorkflowRun = {
            ...withStep(current, {
              name: step.name,
              status: StepStatus.Done,
              attempts: attempt,
              ...(result === undefined ? {} : { result }),
              ...(progress === undefined ? {} : { progress }),
              startedAt: latest.record?.startedAt ?? at,
              endedAt: this.clock.now(),
            }),
            status: WorkflowRunStatus.Running,
          };
          await this.outbox(events, current, at);
          await this.journal.save(next);
          return next;
        });
        if (done === undefined) return { kind: "parked" };
        // oxlint-disable-next-line no-await-in-loop -- see above
        await this.publish(events, current, at);
        return { kind: "done", run: done };
      } catch (error) {
        const progress = latest.record?.progress;
        const failure: WorkflowStepRecord = {
          name: step.name,
          status: StepStatus.Running,
          attempts: attempt,
          error: errorOf(error),
          ...(progress === undefined ? {} : { progress }),
          startedAt: latest.record?.startedAt ?? at,
        };
        const delay = backoffDelay(step.backoff, attempt);
        const late =
          current.deadlineAt !== undefined &&
          this.clock.now().getTime() + delay >= current.deadlineAt.getTime();
        if (!retryable(error) || attempt >= step.attempts || late)
          return {
            kind: "failed",
            run: withStep(current, {
              ...failure,
              status: StepStatus.Failed,
              endedAt: this.clock.now(),
            }),
            error,
          };
        // oxlint-disable-next-line no-await-in-loop -- the attempt count survives a crash
        run = await this.save(withStep(current, failure));
        latest.record = failure;
        // shortcut: a retry waits in process, bounded by the run timeout; park it through the worker once a step's
        // retries may outlive the calling action.
        // oxlint-disable-next-line no-await-in-loop -- see above
        await sleep(delay);
      } finally {
        guard.stop();
      }
    }
  }

  /** Records `run` as compensating with `error`, undoes its completed steps and hands the error on. */
  private async fail(
    run: WorkflowRun,
    instance: object,
    plan: WorkflowPlan,
    error: unknown,
    now: Date,
  ): Promise<Outcome> {
    const compensating = await this.save({
      ...run,
      status: WorkflowRunStatus.Compensating,
      error: errorOf(error),
    });
    return { ...(await this.compensate(compensating, instance, plan, now)), error };
  }

  /** Marks `step` timed out and compensates with `WorkflowTimedOutError`. */
  private timeOut(
    run: WorkflowRun,
    instance: object,
    plan: WorkflowPlan,
    step: StepPlan,
    record: WorkflowStepRecord | undefined,
    now: Date,
  ): Promise<Outcome> {
    const timedOut = withStep(run, {
      ...(record ?? { name: step.name, attempts: 0, startedAt: now }),
      status: StepStatus.TimedOut,
      endedAt: now,
    });
    return this.fail(timedOut, instance, plan, WorkflowTimedOutError.create(), now);
  }

  /**
   * Runs `undo<Step>` of every done step, last first, each in its own transaction, then marks the run compensated. An
   * undo that throws leaves the run failed, its error on the step, for an operator.
   */
  private async compensate(
    start: WorkflowRun,
    instance: object,
    plan: WorkflowPlan,
    now: Date,
  ): Promise<Outcome> {
    let run = start;
    const backwards = plan.steps.reduceRight<StepPlan[]>((list, step) => [...list, step], []);
    for (const step of backwards) {
      const record = recordOf(run, step.name);
      const { undo } = step;
      if (record?.status !== StepStatus.Done || undo === undefined) continue;
      const events: Event[] = [];
      const current = run;
      try {
        // oxlint-disable-next-line no-await-in-loop -- undos run one after another, last step first
        run = await this.journal.transaction(current.scope, async () => {
          const ctx = this.contextOf(current, step, undo, 1, now, events, IDLE, { record });
          await this.within(ctx, () => invoke(instance, undo, [viewOf(current), ctx]));
          const next = withStep(current, {
            ...record,
            status: StepStatus.Compensated,
            endedAt: this.clock.now(),
          });
          await this.outbox(events, current, now);
          await this.journal.save(next);
          return next;
        });
        // oxlint-disable-next-line no-await-in-loop -- see above
        await this.publish(events, current, now);
      } catch (cause) {
        const stuck: WorkflowRun = {
          ...withStep(current, { ...record, error: errorOf(cause) }),
          status: WorkflowRunStatus.Failed,
          endedAt: this.clock.now(),
        };
        return { run: await this.end(stuck), failed: true };
      }
    }
    return {
      run: await this.end({
        ...run,
        status: WorkflowRunStatus.Compensated,
        endedAt: this.clock.now(),
      }),
      failed: true,
    };
  }

  /** The context of one attempt of `method` (the step, or its undo) in `run`. */
  private contextOf(
    run: WorkflowRun,
    step: StepPlan,
    method: string,
    attempt: number,
    at: Date,
    events: Event[],
    guard: Guard,
    latest: Latest,
  ): StepContext {
    return Object.freeze({
      ...run.origin,
      abortSignal: guard.signal,
      now: () => new Date(at.getTime()),
      runId: run.id,
      step: method,
      stepKey: `${run.id}:${method}`,
      attempt,
      progress: latest.record?.progress,
      record: (event: Event) => {
        events.push(event);
      },
      heartbeat: async (progress?: Json) => {
        guard.beat();
        if (method !== step.name) return;
        const kept = progress ?? latest.record?.progress;
        const beat: WorkflowStepRecord = {
          name: step.name,
          status: StepStatus.Running,
          attempts: attempt,
          ...(kept === undefined ? {} : { progress: kept }),
          startedAt: latest.record?.startedAt ?? at,
        };
        latest.record = beat;
        await this.save(withStep(run, beat));
      },
    });
  }

  /** Writes the integration events of `events` to the outbox, in the running transaction. */
  private async outbox(events: readonly Event[], run: WorkflowRun, at: Date): Promise<void> {
    const leaving = events.filter(isIntegration);
    if (leaving.length === 0) return;
    const outbox = this.optional(EventOutbox);
    if (outbox === undefined)
      throw new Error(
        "EventOutbox is not bound: install @stackra/outbox to record an integration event in a workflow step",
      );
    const meta = this.metaOf(run, at);
    const records = await Promise.all(
      leaving.map(async (event): Promise<RecordedEvent> => ({
        event,
        meta: { ...meta, id: await mintId("evt") },
      })),
    );
    await outbox.write(records);
  }

  /** Dispatches the domain events of `events` in process and drains the bus, when one is bound. */
  private async publish(events: readonly Event[], run: WorkflowRun, at: Date): Promise<void> {
    const local = events.filter((event) => !isIntegration(event));
    const bus = this.optional(EventBus);
    if (local.length === 0 || bus === undefined) return;
    const meta = this.metaOf(run, at);
    for (const event of local) bus.dispatch(event, meta);
    await bus.drain();
  }

  /**
   * The metadata of an event a step of `run` recorded at `at`: the starting caller, chained to its call, and the run's
   * scope id in the envelope's scope field (`tenantId`, ADR 0141); the `ScopeRef` itself never enters the envelope.
   */
  private metaOf(run: WorkflowRun, at: Date): Omit<EventMeta, "id"> {
    const { callId, actor, scope } = run.origin;
    return {
      actor,
      ...(scope === undefined ? {} : { tenantId: scope.id }),
      occurredAt: at,
      correlationId: callId,
    };
  }

  /** The origin of a run `call` starts: its id, key, caller and scope, and the running call's locale and market. */
  private originOf(call: CallDescriptor): RunOrigin {
    const {
      type: _type,
      kind: _kind,
      permission: _permission,
      risk: _risk,
      area: _area,
      ...caller
    } = call;
    const current = this.optional(ContextStorage)?.current() as
      | Partial<ExtensionContext>
      | undefined;
    const defaults = WORKFLOW_DEFAULTS.origin;
    return Object.freeze({
      ...caller,
      locale: current?.locale ?? defaults.locale,
      timeZone: current?.timeZone ?? defaults.timeZone,
      currency: current?.currency ?? defaults.currency,
      market: current?.market ?? defaults.market,
    });
  }

  /** Runs `work` as the running call of `ctx`, so `RequestContext.current()` inside a step reads it. */
  private within<T>(ctx: StepContext, work: () => T): T {
    const storage = this.optional(ContextStorage);
    return storage === undefined ? work() : storage.run(ctx, work);
  }

  /** The later of `now` (a tick may act ahead of the clock in a test) and the clock. */
  private instant(now: Date): Date {
    const clock = this.clock.now();
    return clock.getTime() > now.getTime() ? clock : now;
  }

  /** Stores `run`, which has ended, and announces its end (`WorkflowRunEnded`). */
  private async end(run: WorkflowRun): Promise<WorkflowRun> {
    await this.save(run);
    await this.publish(
      [
        WorkflowRunEnded.create({
          runId: run.id,
          workflow: run.workflow,
          version: run.version ?? 1,
          ...(run.automation === undefined ? {} : { automationId: run.automation }),
          status: run.status,
          ...(run.error === undefined ? {} : { error: run.error }),
        }),
      ],
      run,
      run.endedAt ?? this.clock.now(),
    );
    return run;
  }

  /** Stores `run` in a transaction of its own, in its scope, and gives it back. */
  private async save(run: WorkflowRun): Promise<WorkflowRun> {
    await this.journal.transaction(run.scope, () => this.journal.save(run));
    return run;
  }

  /**
   * The instance of `type` the connected container builds.
   *
   * @throws Error before `connect`.
   */
  private instanceOf(type: AnyClass): object {
    return this.connected().get(type);
  }

  /**
   * The connected resolver.
   *
   * @throws Error before `connect`.
   */
  private connected(): Resolver {
    if (this.resolver === undefined)
      throw new Error(
        "NativeWorkflowRunnerDriver is not connected: WorkflowExplorer connects it at boot, the testing plugin in a test",
      );
    return this.resolver;
  }

  /** The bound instance of `port`, or `undefined` when nothing binds it. */
  private optional<T extends object>(port: AnyClass<T>): T | undefined {
    return this.resolver?.has(port) === true ? this.resolver.get(port) : undefined;
  }
}
