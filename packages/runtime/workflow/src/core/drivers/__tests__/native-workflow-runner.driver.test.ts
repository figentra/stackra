/**
 * Stackra file contract:
 * Purpose: unit tests of `NativeWorkflowRunnerDriver`, the engine's conformance on the memory journal: steps run in
 *          order with their results kept for later steps and `output`; a refused step undoes the completed steps last
 *          first and rejects with the refusal; a failing step's retry parks the run until its backoff passes, the caller
 *          answering at once and the worker's tick running the attempt (STA-2613), or waits in process under
 *          `retryInlineMax`; a failing step is retried within its budget with its progress kept, a
 *          live budget read on each failure replacing the declared one unless the read is bad (STA-2610); a
 *          `when` skips; a failing undo leaves the run failed; a signal wait parks the run, answers with the output so
 *          far, and resumes on the matching signal (sent before or after it parked), or times out and compensates;
 *          `startOn` runs once per key; the context carries the call, its scope (the session's when the call has none),
 *          the step key and the clock, and recorded events go to the outbox or the bus with the scope id as the
 *          envelope's scope field and no `scope` key; a tick takes over a run whose runner died; the port methods
 *          delegate. Documents and plans: a document run calls each action block through the pipeline as the run's
 *          caller with resolved inputs and the step key, skips by condition, parks on a trigger block and resumes on
 *          the held occurrence, starts once per key, and refuses an invalid document; a for-each step calls its block
 *          once per item with per-item keys and refuses a list past the configured limit; `chained` continues the chain
 *          of the run a step key names and stops one past the configured depth or a loop; a run resumes on its pinned
 *          version's class and waits while that version is not deployed. A document run keeps the automation it runs
 *          and announces it in `WorkflowRunStarted` and `WorkflowRunEnded`; `cancel` ends a waiting run `cancelled`
 *          (never advanced again, announced) and refuses an ended or unknown one.
 * Boundary: test only; the memory journal and lock driver, a settable clock, a map resolver, recording stand-ins for
 *           the outbox, the bus and the context storage. `backoffDelay` is mocked to zero, and the retry
 *           test runs its wait on fake timers, so a retry does not wait.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0102 (decisions 1, 2 and 7); ADR 0151 (decision 6: conformance);
 *                     ADR 0152 (0294 note).
 */
import {
  Action,
  ActionPipeline,
  ClaimNotLoadedError,
  RowIsolationMissingError,
} from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { CallIsolation, ContextStorage, WorkflowRunner } from "@stackra/actions/contracts";
import type { CallDescriptor } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import type { Actor, Clock, PublicId, ScopeRef } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { DomainEvent, EventBus, IntegrationEvent } from "@stackra/events";
import { EventOutbox } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";
import type { I18nKey } from "@stackra/i18n";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { FieldType, Operator } from "@stackra/rules/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Signal } from "#core/bases/signal.base";
import { Workflow } from "#core/bases/workflow.base";
import { Step } from "#core/decorators/step.decorator";
import { MemoryWorkflowJournalDriver } from "#core/drivers/memory-workflow-journal.driver";
import { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import { BlockKind } from "#core/enums/block-kind.enum";
import { StepStatus } from "#core/enums/step-status.enum";
import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import type { WorkflowConfig } from "#config/workflow.config";
import { AutomationInvalidError } from "#core/errors/automation-invalid.error";
import { ForEachItemsInvalidError } from "#core/errors/for-each-items-invalid.error";
import { WorkflowRunEnded } from "#core/events/workflow-run-ended.event";
import { WorkflowRunStarted } from "#core/events/workflow-run-started.event";
import { registerBlocks } from "#core/functions/register-blocks.function";
import { registerWorkflows } from "#core/functions/register-workflows.function";
import type { Run } from "#core/types/run.type";
import type { RunOrigin } from "#core/types/run-origin.type";
import type { StepContext } from "#core/types/step-context.type";
import type { SignalClaim } from "#core/types/signal-claim.type";
import type { StepRetryValues } from "#core/types/step-retry-values.type";
import type { WorkflowRun } from "#core/types/workflow-run.type";

vi.mock("@stackra/contracts", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  backoffDelay: () => 0,
}));

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** `minutes` after noon. */
const plus = (minutes: number): Date => new Date(NOON.getTime() + minutes * 60_000);

const ACTOR: Actor = { kind: ActorKind.System, id: "sys_test" };

const SCOPE: ScopeRef = { id: "scp_1", path: "platform.acme" };

const ORIGIN: RunOrigin = {
  callId: "call-1",
  key: "order.place",
  actor: ACTOR,
  locale: "en",
  timeZone: "UTC",
  currency: "USD",
  market: "default",
};

/** A running run with no step reached, as a dead runner left it. */
const STRANDED: WorkflowRun = {
  id: `wfr_${"0".repeat(22)}wner`,
  workflow: "OrderWorkflow",
  status: WorkflowRunStatus.Running,
  input: { sku: "sku_1", quantity: 1 },
  origin: ORIGIN,
  startedAt: NOON,
  steps: [],
};

class CardDeclinedError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {}

class OrderPlaced extends IntegrationEvent({ name: "order.placed" }) {
  orderId!: string;
}

class PointsDebited extends DomainEvent {
  points!: number;
}

interface OrderInput {
  readonly sku: string;
  readonly quantity: number;
}

class OrderWorkflow extends Workflow<OrderInput>({ timeout: "2m" }) {
  readonly calls: string[] = [];

  failures: unknown[] = [];

  recording = false;

  async price(run: Run<this>, ctx: StepContext): Promise<{ total: number; key: string }> {
    this.calls.push("price");
    return { total: run.input.quantity * 10, key: ctx.stepKey };
  }

  async reserve(): Promise<void> {
    this.calls.push("reserve");
  }

  async undoReserve(): Promise<void> {
    this.calls.push("undoReserve");
  }

  async create(_run: Run<this>, ctx: StepContext): Promise<string> {
    this.calls.push("create");
    if (this.recording) {
      ctx.record(Object.assign(new OrderPlaced(), { orderId: "ord_1" }));
      ctx.record(Object.assign(new PointsDebited(), { points: 5 }));
    }
    return "ord_1";
  }

  async undoCreate(run: Run<this>): Promise<void> {
    this.calls.push(`undoCreate:${run.results.create}`);
  }

  @Step({ retry: { attempts: 2 } })
  async authorize(run: Run<this>, ctx: StepContext): Promise<{ paymentId: string }> {
    this.calls.push(`authorize:${ctx.attempt}:${JSON.stringify(ctx.progress ?? null)}`);
    const failure = this.failures.shift();
    if (failure !== undefined) {
      await ctx.heartbeat({ page: ctx.attempt });
      throw failure;
    }
    return { paymentId: `pay_${run.results.create}` };
  }

  output(run: Run<this>): { orderId: string; total: number } {
    return { orderId: run.results.create, total: run.results.price.total };
  }
}

class Confirmed extends Signal {
  by!: string;
}

interface RedeemInput {
  readonly memberId: string;
  readonly points: number;
}

class RedeemWorkflow extends Workflow<RedeemInput>({ timeout: "20m" }) {
  readonly calls: string[] = [];

  async quote(run: Run<this>): Promise<{ points: number }> {
    this.calls.push("quote");
    return { points: run.input.points };
  }

  async debit(run: Run<this>): Promise<number> {
    this.calls.push("debit");
    return 1000 - run.results.quote.points;
  }

  async undoDebit(): Promise<void> {
    this.calls.push("undoDebit");
  }

  @Step<RedeemWorkflow>({
    waitFor: Confirmed,
    correlate: (run) => ({ memberId: run.input.memberId }),
    timeout: "15m",
  })
  async confirm(_run: Run<this>, _ctx: StepContext, confirmed: Confirmed): Promise<Confirmed> {
    this.calls.push(`confirm:${confirmed.by}`);
    return confirmed;
  }

  output(run: Run<this>): { balance: number } {
    return { balance: run.results.debit };
  }
}

class SkippingWorkflow extends Workflow<{ readonly gift: boolean }>({}) {
  @Step<SkippingWorkflow>({ when: (run) => run.input.gift })
  async wrap(): Promise<string> {
    return "wrapped";
  }

  async ship(): Promise<string> {
    return "shipped";
  }
}

/** A step that declares one attempt and reads its live budget, as a settings-backed retry does (STA-2610). */
class LiveRetryWorkflow extends Workflow({}) {
  /** The attempts the step saw. */
  readonly attempts: number[] = [];

  /** What `live` answers, or a read that fails. */
  live: StepRetryValues | Error | undefined;

  /** Failures still to throw. */
  failures = 0;

  @Step<LiveRetryWorkflow>({
    retry: {
      attempts: 1,
      live: async (workflow) => {
        if (workflow.live instanceof Error) throw workflow.live;
        return workflow.live;
      },
    },
  })
  async send(_run: Run<this>, ctx: StepContext): Promise<string> {
    this.attempts.push(ctx.attempt);
    if (this.failures > 0) {
      this.failures -= 1;
      throw new TypeError("provider timeout");
    }
    return "sent";
  }
}

class BrokenUndoWorkflow extends Workflow({}) {
  async hold(): Promise<void> {}

  async undoHold(): Promise<void> {
    throw new TypeError("release failed");
  }

  async charge(): Promise<void> {
    throw CardDeclinedError.create();
  }
}

class PaymentCaptured {
  orderId!: string;
}

class FulfilWorkflow extends Workflow({
  startOn: PaymentCaptured,
  correlate: (event) => event.orderId,
}) {
  runs = 0;

  async allocate(): Promise<void> {
    this.runs += 1;
  }
}

/** A clock the test moves. */
function clockAt(at: Date): Clock & { at: Date } {
  return {
    at,
    now(): Date {
      return new Date(this.at);
    },
  } as Clock & { at: Date };
}

/** A resolver over fixed instances. */
function resolverOf(entries: readonly (readonly [AnyClass, object])[]): Resolver {
  const instances = new Map<AnyClass, object>(entries);
  return {
    has: (token) => instances.has(token),
    get: <T extends object>(token: AnyClass<T>) => instances.get(token) as T,
  };
}

/** A workflow whose output is computed asynchronously, and one whose async output rejects. */
class AsyncOutputWorkflow extends Workflow<{ readonly amount: number }>({}) {
  async charge(run: Run<this>): Promise<{ chargeId: string }> {
    return { chargeId: `chg_${run.input.amount}` };
  }

  async output(run: Run<this>): Promise<{ chargeId: string }> {
    await Promise.resolve();
    return { chargeId: run.results.charge.chargeId };
  }
}

class RejectingOutputWorkflow extends Workflow<{ readonly amount: number }>({}) {
  async charge(): Promise<number> {
    return 1;
  }

  async output(): Promise<never> {
    throw new Error("not reachable yet");
  }
}

/** An engine on `journal` (a fresh memory journal by default), connected to `entries`. */
function engineWith(
  entries: readonly (readonly [AnyClass, object])[],
  journal: MemoryWorkflowJournalDriver = new MemoryWorkflowJournalDriver(),
  config?: WorkflowConfig,
) {
  const clock = clockAt(NOON);
  const runner = new NativeWorkflowRunnerDriver(
    journal,
    new Locks(new MemoryLockDriver(clock), clock),
    clock,
    config,
  );
  runner.connect(resolverOf(entries));
  return { runner, journal, clock };
}

/** `[name, status]` of each step of `run`. */
const statuses = (
  run: { readonly steps: readonly { name: string; status: string }[] } | undefined,
) => run?.steps.map((step) => [step.name, step.status]);

describe(NativeWorkflowRunnerDriver, () => {
  it("is the WorkflowRunner", () => {
    expect(engineWith([]).runner).toBeInstanceOf(WorkflowRunner);
  });

  it("runs every step in order, keeps each result for later steps and returns the output", async () => {
    const order = new OrderWorkflow();
    const { runner } = engineWith([[OrderWorkflow, order]]);

    const output = await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 2 }, ORIGIN);

    expect(output).toEqual({ orderId: "ord_1", total: 20 });
    const run = await runner.last(OrderWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Completed);
    expect(statuses(run)).toEqual([
      ["price", StepStatus.Done],
      ["reserve", StepStatus.Done],
      ["create", StepStatus.Done],
      ["authorize", StepStatus.Done],
    ]);
    expect(run?.steps[0]?.result).toEqual({ total: 20, key: `${run?.id}:price` });
    expect(run?.input).toEqual({ sku: "sku_1", quantity: 2 });
  });

  it("views a run with its awaited async output, and null when that output rejects (workflow.run.get)", async () => {
    const { runner } = engineWith([
      [AsyncOutputWorkflow, new AsyncOutputWorkflow()],
      [RejectingOutputWorkflow, new RejectingOutputWorkflow()],
    ]);
    await runner.start(AsyncOutputWorkflow, { amount: 20 }, ORIGIN);
    const run = await runner.last(AsyncOutputWorkflow);
    expect((await runner.view(run?.id as never))?.output).toEqual({ chargeId: "chg_20" });

    await runner.start(RejectingOutputWorkflow, { amount: 1 }, ORIGIN).catch(() => undefined);
    const rejected = await runner.last(RejectingOutputWorkflow);
    expect((await runner.view(rejected?.id as never))?.output).toBeNull();
  });

  it("undoes the completed steps last first when a step is refused, and rejects with the refusal", async () => {
    const order = new OrderWorkflow();
    order.failures.push(CardDeclinedError.create());
    const { runner } = engineWith([[OrderWorkflow, order]]);

    await expect(
      runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN),
    ).rejects.toBeInstanceOf(CardDeclinedError);

    const run = await runner.last(OrderWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Compensated);
    expect(run?.error?.code).toBe("card_declined");
    expect(statuses(run)).toEqual([
      ["price", StepStatus.Done],
      ["reserve", StepStatus.Compensated],
      ["create", StepStatus.Compensated],
      ["authorize", StepStatus.Failed],
    ]);
    expect(order.calls.slice(-2)).toEqual(["undoCreate:ord_1", "undoReserve"]);
  });

  it("parks a retry until its backoff passes, answers at once, and runs it on the worker's tick (STA-2613)", async () => {
    const order = new OrderWorkflow();
    order.failures.push(new TypeError("gateway timeout"));
    const { runner } = engineWith([[OrderWorkflow, order]]);

    // The caller answers with the output so far, without waiting out the backoff.
    expect(await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN)).toEqual({
      orderId: "ord_1",
      total: 10,
    });
    const parked = await runner.last(OrderWorkflow);
    expect(parked?.status).toBe(WorkflowRunStatus.Waiting);
    const step = parked?.steps.at(-1);
    expect(step).toMatchObject({ name: "authorize", status: StepStatus.Waiting, attempts: 1 });
    expect(step?.error).toBeDefined();
    expect(step?.wakeAt?.getTime()).toBeGreaterThan(NOON.getTime());

    // Not due yet: the tick leaves it; due: it runs attempt 2 and completes.
    expect(await runner.tick(NOON)).toBe(0);
    expect(await runner.tick(plus(1))).toBe(1);
    const run = await runner.last(OrderWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Completed);
    expect(run?.steps.at(-1)).toMatchObject({ attempts: 2, progress: { page: 1 } });
    expect(order.calls.filter((call) => call.startsWith("authorize"))).toEqual([
      "authorize:1:null",
      'authorize:2:{"page":1}',
    ]);
  });

  it("retries a failing step within its budget in process when its backoff is under retryInlineMax", async () => {
    const order = new OrderWorkflow();
    order.failures.push(new TypeError("gateway timeout"));
    const { runner } = engineWith([[OrderWorkflow, order]], undefined, {
      journal: "memory",
      signalRetention: "7d",
      retryInlineMax: "1m",
    } as WorkflowConfig);

    // The back-off wait is a real timer; the `backoffDelay` mock misses once a setup file has loaded
    // @stackra/contracts, so the wait runs on fake timers.
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      const state = { settled: false };
      const started = runner
        .start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN)
        .finally(() => {
          state.settled = true;
        });
      // Advance until the run settles: the retry's timer is set only after the first attempt's awaits.
      while (!state.settled) await vi.advanceTimersByTimeAsync(60_000);
      await started;
    } finally {
      vi.useRealTimers();
    }

    const run = await runner.last(OrderWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Completed);
    expect(run?.steps.at(-1)).toMatchObject({ attempts: 2, progress: { page: 1 } });
    expect(order.calls.filter((call) => call.startsWith("authorize"))).toEqual([
      "authorize:1:null",
      'authorize:2:{"page":1}',
    ]);
  });

  it("takes a step's live retry budget when it fails, and its declared one when the read is bad (STA-2610)", async () => {
    // Each retry parks (STA-2613), so the worker's ticks run the attempts until the run ends.
    const settle = async (workflow: LiveRetryWorkflow): Promise<string | undefined> => {
      const { runner } = engineWith([[LiveRetryWorkflow, workflow]]);
      await runner.start(LiveRetryWorkflow, undefined, ORIGIN).catch(() => undefined);
      for (let minute = 1; minute <= 10; minute += 1) await runner.tick(plus(minute * 10));
      return (await runner.last(LiveRetryWorkflow))?.status;
    };

    const raised = Object.assign(new LiveRetryWorkflow(), { live: { attempts: 3 }, failures: 2 });
    expect(await settle(raised)).toBe(WorkflowRunStatus.Completed);
    expect(raised.attempts).toEqual([1, 2, 3]);

    for (const live of [
      { attempts: 0 },
      { attempts: 1.5 },
      new TypeError("settings unavailable"),
    ]) {
      const kept = Object.assign(new LiveRetryWorkflow(), { live, failures: 1 });
      expect(await settle(kept)).toBe(WorkflowRunStatus.Compensated);
      expect(kept.attempts).toEqual([1]);
    }
  });

  it("skips a step whose when is false", async () => {
    const { runner } = engineWith([[SkippingWorkflow, new SkippingWorkflow()]]);

    await runner.start(SkippingWorkflow, { gift: false }, ORIGIN);

    expect(statuses(await runner.last(SkippingWorkflow))).toEqual([
      ["wrap", StepStatus.Skipped],
      ["ship", StepStatus.Done],
    ]);
  });

  it("leaves the run failed, the undo's error on its step, when an undo throws", async () => {
    const { runner } = engineWith([[BrokenUndoWorkflow, new BrokenUndoWorkflow()]]);

    await expect(runner.start(BrokenUndoWorkflow, undefined, ORIGIN)).rejects.toBeInstanceOf(
      CardDeclinedError,
    );

    const run = await runner.last(BrokenUndoWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Failed);
    expect(run?.steps[0]).toMatchObject({
      status: StepStatus.Done,
      error: { code: "internal", message: "release failed" },
    });
  });

  it("parks on a signal wait, answers with the output so far, and resumes when the signal comes", async () => {
    const redeem = new RedeemWorkflow();
    const { runner, clock } = engineWith([[RedeemWorkflow, redeem]]);

    const output = await runner.start(RedeemWorkflow, { memberId: "mem_1", points: 300 }, ORIGIN);

    expect(output).toEqual({ balance: 700 });
    const parked = await runner.last(RedeemWorkflow);
    expect(parked?.status).toBe(WorkflowRunStatus.Waiting);
    expect(parked?.steps.at(-1)).toMatchObject({
      status: StepStatus.Waiting,
      signal: "Confirmed",
      wakeAt: plus(15),
    });

    await runner.hold(Confirmed, { by: "usr_1" }, { memberId: "mem_1" });
    clock.at = plus(1);
    expect(await runner.tick()).toBe(1);

    const run = await runner.last(RedeemWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Completed);
    expect(run?.steps.at(-1)).toMatchObject({ status: StepStatus.Done, result: { by: "usr_1" } });
    expect(redeem.calls).toEqual(["quote", "debit", "confirm:usr_1"]);
  });

  it("takes a signal sent before the run parked", async () => {
    const { runner } = engineWith([[RedeemWorkflow, new RedeemWorkflow()]]);

    await runner.hold(Confirmed, { by: "usr_1" }, { memberId: "mem_1" });
    await runner.start(RedeemWorkflow, { memberId: "mem_1", points: 100 }, ORIGIN);

    expect((await runner.last(RedeemWorkflow))?.status).toBe(WorkflowRunStatus.Completed);
  });

  it("never resumes a run on a signal of another correlation", async () => {
    const { runner } = engineWith([[RedeemWorkflow, new RedeemWorkflow()]]);
    await runner.start(RedeemWorkflow, { memberId: "mem_1", points: 100 }, ORIGIN);

    await runner.hold(Confirmed, { by: "usr_2" }, { memberId: "mem_2" });

    expect(await runner.tick(plus(1))).toBe(0);
    expect((await runner.last(RedeemWorkflow))?.status).toBe(WorkflowRunStatus.Waiting);
  });

  it("times out a wait no signal ended and undoes the completed steps", async () => {
    const redeem = new RedeemWorkflow();
    const { runner } = engineWith([[RedeemWorkflow, redeem]]);
    await runner.start(RedeemWorkflow, { memberId: "mem_1", points: 300 }, ORIGIN);

    await runner.tick(plus(16));

    const run = await runner.last(RedeemWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Compensated);
    expect(run?.error?.code).toBe("workflow_timed_out");
    expect(run?.steps.map((step) => `${step.name}:${step.status}`)).toEqual([
      "quote:done",
      "debit:compensated",
      "confirm:timed_out",
    ]);
    expect(redeem.calls.at(-1)).toBe("undoDebit");
  });

  it("resumes on a signal that arrived before the wait timed out, however late the tick", async () => {
    const { runner } = engineWith([[RedeemWorkflow, new RedeemWorkflow()]]);
    await runner.start(RedeemWorkflow, { memberId: "mem_1", points: 300 }, ORIGIN);
    await runner.hold(Confirmed, { by: "usr_1" }, { memberId: "mem_1" });

    await runner.tick(plus(16));

    expect((await runner.last(RedeemWorkflow))?.status).toBe(WorkflowRunStatus.Completed);
  });

  it("starts a startOn workflow once per correlation key", async () => {
    const fulfil = new FulfilWorkflow();
    const { runner } = engineWith([[FulfilWorkflow, fulfil]]);
    const event = Object.assign(new PaymentCaptured(), { orderId: "ord_1" });

    await runner.start(FulfilWorkflow, event, ORIGIN);
    await runner.start(FulfilWorkflow, event, ORIGIN);

    expect(fulfil.runs).toBe(1);
  });

  it("writes recorded integration events to the outbox and dispatches domain events to the bus", async () => {
    const written: RecordedEvent[] = [];
    const dispatched: [unknown, unknown][] = [];
    const outbox = {
      write: async (records: readonly RecordedEvent[]) => void written.push(...records),
    };
    const bus = {
      dispatch: (event: unknown, meta: unknown) => void dispatched.push([event, meta]),
      drain: async () => [],
    };
    const order = Object.assign(new OrderWorkflow(), { recording: true });
    const { runner } = engineWith([
      [OrderWorkflow, order],
      [EventOutbox, outbox],
      [EventBus, bus],
    ]);

    await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, { ...ORIGIN, scope: SCOPE });

    expect(written).toHaveLength(1);
    expect(written[0]?.event).toBeInstanceOf(OrderPlaced);
    expect(written[0]?.meta).toEqual({
      id: expect.stringMatching(/^evt_/),
      actor: ACTOR,
      scopeId: SCOPE.id,
      correlationId: "call-1",
      occurredAt: NOON,
    });
    const debited = dispatched.filter(([event]) => event instanceof PointsDebited);
    expect(debited).toHaveLength(1);
    expect(debited[0]?.[1]).not.toHaveProperty("scope");
    expect(dispatched.map(([event]) => (event as object).constructor)).toEqual([
      WorkflowRunStarted,
      PointsDebited,
      WorkflowRunEnded,
    ]);
    expect(dispatched.at(-1)?.[0]).toMatchObject({ status: WorkflowRunStatus.Completed });
  });

  it("gives a run started without a call scope the session's, for its steps and its events", async () => {
    const written: RecordedEvent[] = [];
    const outbox = {
      write: async (records: readonly RecordedEvent[]) => void written.push(...records),
    };
    class ScopedJournal extends MemoryWorkflowJournalDriver {
      override currentScope(): Promise<ScopeRef | undefined> {
        return Promise.resolve(SCOPE);
      }
    }
    const order = Object.assign(new OrderWorkflow(), { recording: true });
    const { runner } = engineWith(
      [
        [OrderWorkflow, order],
        [EventOutbox, outbox],
      ],
      new ScopedJournal(),
    );

    await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN);

    const run = await runner.last(OrderWorkflow);
    expect(run?.scope).toEqual(SCOPE);
    expect(run?.origin.scope).toEqual(SCOPE);
    expect(written[0]?.meta.scopeId).toBe(SCOPE.id);
  });

  it("runs each step through a bound CallIsolation as the run's stored actor in its scope", async () => {
    const runs: [Actor, ScopeRef | readonly ScopeRef[] | undefined, boolean][] = [];
    class Recording extends Driver(CallIsolation) {
      run<T>(
        actor: Actor,
        scope: ScopeRef | readonly ScopeRef[] | undefined,
        work: () => Promise<T>,
        options: { readonly readOnly: boolean },
      ): Promise<T> {
        runs.push([actor, scope, options.readOnly]);
        return work();
      }
    }
    const outbox = { write: async (_records: readonly RecordedEvent[]) => undefined };
    const order = Object.assign(new OrderWorkflow(), { recording: true });
    const { runner } = engineWith([
      [OrderWorkflow, order],
      [EventOutbox, outbox],
      [CallIsolation, new Recording()],
    ]);

    await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, { ...ORIGIN, scope: SCOPE });

    // a step runs as the run's actor; a save as the workflow runner in the run's owner (none here: a platform run)
    const steps = runs.filter(([actor]) => actor.id === ORIGIN.actor.id);
    expect(steps.length).toBeGreaterThan(0);
    for (const [, scope, readOnly] of steps) {
      expect(scope).toEqual(SCOPE);
      expect(readOnly).toBe(false);
    }
    const saves = runs.filter(([actor]) => actor.id !== ORIGIN.actor.id);
    expect(saves.length).toBeGreaterThan(0);
    for (const [actor, scope] of saves) {
      expect(actor).toEqual({ kind: ActorKind.System, id: "sys_workflow_runner" });
      expect(scope).toBeUndefined();
    }
  });

  it("owns a run by the session's tenant and saves it in that owner's isolation", async () => {
    const owners: (string | undefined)[] = [];
    class Recording extends Driver(CallIsolation) {
      run<T>(actor: Actor, _scope: unknown, work: () => Promise<T>): Promise<T> {
        if (actor.id === "sys_workflow_runner") owners.push(actor.scopeId);
        return work();
      }
    }
    class OwnedJournal extends MemoryWorkflowJournalDriver {
      override currentOwner(): Promise<PublicId<"scp"> | undefined> {
        return Promise.resolve("scp_acme" as PublicId<"scp">);
      }
    }
    const { runner } = engineWith(
      [
        [OrderWorkflow, new OrderWorkflow()],
        [CallIsolation, new Recording()],
      ],
      new OwnedJournal(),
    );

    await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN);

    expect((await runner.last(OrderWorkflow))?.ownerId).toBe("scp_acme");
    expect(owners.length).toBeGreaterThan(0);
    expect(new Set(owners)).toEqual(new Set(["scp_acme"]));
  });

  it("gives a system or job origin that names no tenant the run's owner, and never rewrites another", async () => {
    class OwnedJournal extends MemoryWorkflowJournalDriver {
      override currentOwner(): Promise<PublicId<"scp"> | undefined> {
        return Promise.resolve("scp_acme" as PublicId<"scp">);
      }
    }
    class Passing extends Driver(CallIsolation) {
      run<T>(_actor: Actor, _scope: unknown, work: () => Promise<T>): Promise<T> {
        return work();
      }
    }
    /** The origin actor a run started by `actor` keeps, on a journal of `owned` (else the platform's). */
    const kept = async (actor: Actor, owned: boolean): Promise<Actor | undefined> => {
      const { runner } = engineWith(
        [
          [OrderWorkflow, new OrderWorkflow()],
          [CallIsolation, new Passing()],
        ],
        owned ? new OwnedJournal() : new MemoryWorkflowJournalDriver(),
      );
      await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, { ...ORIGIN, actor });
      return (await runner.last(OrderWorkflow))?.origin.actor;
    };
    const system = { kind: ActorKind.System, id: "sys_workflow" } as Actor;
    const job = { kind: ActorKind.Job, id: "job_nightly" } as unknown as Actor;
    expect(await kept(system, true)).toEqual({ ...system, scopeId: "scp_acme" });
    expect(await kept(job, true)).toEqual({ ...job, scopeId: "scp_acme" });
    // an actor that names a scope, the run's tenant or another, is never rewritten
    for (const scopeId of ["scp_acme", "scp_globex"])
      expect(await kept({ ...system, scopeId } as Actor, true)).toEqual({ ...system, scopeId });
    const user = { kind: ActorKind.User, id: "usr_1" } as unknown as Actor;
    const agent = { kind: ActorKind.Agent, id: "agt_1" } as unknown as Actor;
    expect(await kept(user, true)).toEqual(user);
    expect(await kept(agent, true)).toEqual(agent);
    // a platform launch (no owner) keeps the actor as it is
    expect(await kept(system, false)).toEqual(system);
  });

  it("refuses to save or advance an owned run when no isolation is bound", async () => {
    class OwnedJournal extends MemoryWorkflowJournalDriver {
      override currentOwner(): Promise<PublicId<"scp"> | undefined> {
        return Promise.resolve("scp_acme" as PublicId<"scp">);
      }
    }
    const journal = new OwnedJournal();
    const { runner } = engineWith([[OrderWorkflow, new OrderWorkflow()]], journal);

    await expect(
      runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN),
    ).rejects.toBeInstanceOf(RowIsolationMissingError);
    await journal.save({ ...STRANDED, ownerId: "scp_acme" as PublicId<"scp"> });
    await expect(runner.tick(NOON)).rejects.toBeInstanceOf(RowIsolationMissingError);
  });

  it("fails the tick when a claimed run does not load, never skipping it", async () => {
    class LosingJournal extends MemoryWorkflowJournalDriver {
      override find(): Promise<WorkflowRun | undefined> {
        return Promise.resolve(undefined);
      }
    }
    const journal = new LosingJournal();
    const { runner } = engineWith([[OrderWorkflow, new OrderWorkflow()]], journal);
    await journal.save(STRANDED);

    await expect(runner.tick(NOON)).rejects.toBeInstanceOf(ClaimNotLoadedError);
  });

  it("removes lapsed signals per owner, each in its owner's isolation, and fails on one claimed again", async () => {
    const removals: [string | undefined, readonly string[]][] = [];
    let owner: string | undefined;
    class Recording extends Driver(CallIsolation) {
      async run<T>(actor: Actor, _scope: unknown, work: () => Promise<T>): Promise<T> {
        owner = actor.scopeId;
        return work();
      }
    }
    class OwnedSignals extends MemoryWorkflowJournalDriver {
      override async expired(): Promise<readonly SignalClaim[]> {
        return [
          { id: "wfs_a1" as PublicId<"wfs">, ownerId: "scp_acme" as PublicId<"scp"> },
          { id: "wfs_p1" as PublicId<"wfs"> },
          { id: "wfs_a2" as PublicId<"wfs">, ownerId: "scp_acme" as PublicId<"scp"> },
        ];
      }

      override async remove(ids: readonly PublicId<"wfs">[]): Promise<void> {
        removals.push([owner, ids]);
      }
    }
    const { runner } = engineWith([[CallIsolation, new Recording()]], new OwnedSignals());

    await runner.tick(NOON);

    expect(removals).toEqual([
      ["scp_acme", ["wfs_a1", "wfs_a2"]],
      [undefined, ["wfs_p1"]],
    ]);
    class Stuck extends OwnedSignals {
      override async expired(): Promise<readonly SignalClaim[]> {
        return Array.from({ length: 100 }, () => ({ id: "wfs_x" as PublicId<"wfs"> }));
      }
    }
    await expect(
      engineWith([[CallIsolation, new Recording()]], new Stuck()).runner.tick(NOON),
    ).rejects.toBeInstanceOf(ClaimNotLoadedError);
  });

  it("refuses an integration event when no outbox is bound, failing the step", async () => {
    const order = Object.assign(new OrderWorkflow(), { recording: true });
    const { runner } = engineWith([[OrderWorkflow, order]]);

    await expect(
      runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN),
    ).rejects.toThrow(/EventOutbox is not bound/);
    expect((await runner.last(OrderWorkflow))?.status).toBe(WorkflowRunStatus.Compensated);
  });

  it("takes a run's origin from the call and the running context, and runs each step in that context", async () => {
    const seen: object[] = [];
    const storage = {
      current: () => ({ locale: "ar-SA", timeZone: "Asia/Riyadh", currency: "SAR", market: "sa" }),
      run: <T>(value: object, work: () => T): T => {
        seen.push(value);
        return work();
      },
    };
    const { runner } = engineWith([
      [SkippingWorkflow, new SkippingWorkflow()],
      [ContextStorage, storage],
    ]);
    class PlaceOrderAction {}
    const call: CallDescriptor = {
      callId: "call-9",
      type: PlaceOrderAction,
      kind: "action",
      key: "orders.order.place@1",
      actor: ACTOR,
      scope: SCOPE,
      area: ApiArea.App,
    };

    await runner.run(SkippingWorkflow, { gift: true }, call);

    const run = await runner.last(SkippingWorkflow);
    expect(run?.origin).toEqual({
      callId: "call-9",
      key: "orders.order.place@1",
      actor: ACTOR,
      scope: SCOPE,
      locale: "ar-SA",
      timeZone: "Asia/Riyadh",
      currency: "SAR",
      market: "sa",
    });
    expect(seen).toHaveLength(2);
    expect(seen[0]).toMatchObject({
      callId: "call-9",
      scope: SCOPE,
      step: "wrap",
      attempt: 1,
      runId: run?.id,
    });
  });

  it("holds a signal sent through the port", async () => {
    const { runner } = engineWith([[RedeemWorkflow, new RedeemWorkflow()]]);
    await runner.start(RedeemWorkflow, { memberId: "mem_1", points: 1 }, ORIGIN);

    await runner.signal(Confirmed, { by: "usr_1" }, { memberId: "mem_1" }, {} as CallDescriptor);
    await runner.tick(plus(1));

    expect((await runner.last(RedeemWorkflow))?.status).toBe(WorkflowRunStatus.Completed);
  });

  it("takes over a running run whose runner died", async () => {
    // A well-formed public id, as the run's events validate it.
    const ORPHAN = `wfr_${"0".repeat(22)}rphn` as const;
    const order = new OrderWorkflow();
    const { runner, journal } = engineWith([[OrderWorkflow, order]]);
    await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN);
    const finished = await runner.last(OrderWorkflow);
    if (finished === undefined) throw new Error("the run was recorded");
    await journal.save({
      ...finished,
      id: ORPHAN,
      status: WorkflowRunStatus.Running,
      steps: finished.steps.slice(0, 2),
    });
    order.calls.length = 0;

    expect(await runner.tick()).toBe(1);

    expect((await runner.find(ORPHAN))?.status).toBe(WorkflowRunStatus.Completed);
    expect(order.calls).toEqual(["create", "authorize:1:null"]);
  });

  it("refuses a signal class that is not a signal, and a run before connect", async () => {
    const { runner } = engineWith([]);
    class NotASignal {}
    await expect(runner.hold(NotASignal, {})).rejects.toBeInstanceOf(TypeError);
    const clock = clockAt(NOON);
    const unconnected = new NativeWorkflowRunnerDriver(
      new MemoryWorkflowJournalDriver(),
      new Locks(new MemoryLockDriver(clock), clock),
      clock,
    );
    await expect(unconnected.start(SkippingWorkflow, { gift: true }, ORIGIN)).rejects.toThrow(
      /not connected/,
    );
  });

  it("works until its signal aborts", async () => {
    const { runner } = engineWith([]);
    const controller = new AbortController();
    controller.abort();
    await expect(runner.work({ signal: controller.signal })).resolves.toBeUndefined();
  });
});

class CodConfirmed extends DomainEvent {
  orderId!: string;

  answer!: string;
}

class SendSmsAction extends Action({
  key: "sms.send",
  actors: [ActorKind.System],
}) {
  async handle(): Promise<void> {}
}

registerBlocks([
  {
    key: "orders.cod_confirmed",
    kind: BlockKind.Trigger,
    type: CodConfirmed,
    label: "orders::blocks.cod_confirmed",
    facts: { answer: { type: FieldType.String, label: "orders::facts.answer" as I18nKey } },
    correlate: (event: CodConfirmed) => event.orderId,
  },
  { key: "sms.send", kind: BlockKind.Action, type: SendSmsAction, label: "sms::blocks.send" },
]);

/** An automation that asks for a COD confirmation, waits for it and thanks the buyer. */
const COD = {
  key: "commerce.cod_confirmation",
  version: 3,
  trigger: { block: "orders.cod_confirmed" },
  steps: [
    {
      name: "ask",
      block: "sms.send",
      input: { orderId: { $ref: "input.orderId" }, text: "Confirm?" },
    },
    {
      name: "skipped",
      block: "sms.send",
      when: { field: "trigger.answer", operator: Operator.Equals, value: "never" },
    },
    {
      name: "thank",
      block: "sms.send",
      waitFor: { block: "orders.cod_confirmed", correlate: "input.orderId", timeout: "1h" },
      input: { answer: { $ref: "event.answer" }, asked: { $ref: "results.ask.messageId" } },
    },
  ],
};

/** An engine whose action pipeline is a recording stand-in, with `config` when given. */
function documentEngine(config?: Partial<WorkflowConfig>) {
  const calls: { type: unknown; input: unknown; request: Record<string, unknown> }[] = [];
  const pipeline = {
    execute: async (type: unknown, input: unknown, request: Record<string, unknown>) => {
      calls.push({ type, input, request });
      return { messageId: `msg_${calls.length}` };
    },
  };
  if (config === undefined) return { ...engineWith([[ActionPipeline, pipeline]]), calls };
  const clock = clockAt(NOON);
  const journal = new MemoryWorkflowJournalDriver();
  const runner = new NativeWorkflowRunnerDriver(
    journal,
    new Locks(new MemoryLockDriver(clock), clock),
    clock,
    { journal: "memory", signalRetention: "7d", ...config } as WorkflowConfig,
  );
  runner.connect(resolverOf([[ActionPipeline, pipeline]]));
  return { runner, journal, clock, calls };
}

/** A plan that texts each buyer of its input. */
const EACH = {
  key: "ai.plan",
  steps: [
    {
      name: "notify",
      block: "sms.send",
      forEach: { items: "input.buyers" },
      input: { to: { $ref: "item.phone" }, text: "Shipped" },
    },
  ],
};

describe("NativeWorkflowRunnerDriver documents and plans", () => {
  it("runs a document's action blocks through the pipeline as the run's caller", async () => {
    const { runner, calls, clock } = documentEngine();
    const id = await runner.startDocument(
      COD,
      { orderId: "ord_1", answer: "pending" },
      {
        ...ORIGIN,
        scope: SCOPE,
      },
    );

    const parked = id === undefined ? undefined : await runner.find(id);
    expect(parked).toMatchObject({
      workflow: "workflow.document",
      version: 3,
      status: WorkflowRunStatus.Waiting,
    });
    expect(statuses(parked)).toEqual([
      ["ask", StepStatus.Done],
      ["skipped", StepStatus.Skipped],
      ["thank", StepStatus.Waiting],
    ]);
    expect(calls[0]).toMatchObject({
      type: SendSmsAction,
      input: { orderId: "ord_1", text: "Confirm?" },
      request: { actor: ACTOR, scope: SCOPE, idempotencyKey: `${id}:ask` },
    });

    await runner.hold(CodConfirmed, { orderId: "ord_1", answer: "yes" }, "ord_1");
    clock.at = plus(1);
    expect(await runner.tick()).toBe(1);

    expect((id === undefined ? undefined : await runner.find(id))?.status).toBe(
      WorkflowRunStatus.Completed,
    );
    expect(calls[1]?.input).toEqual({ answer: "yes", asked: "msg_1" });
  });

  it("runs an agent's plan once per key, and refuses an invalid one", async () => {
    const { runner, calls } = documentEngine();
    const plan = {
      key: "ai.plan",
      steps: [{ name: "notify", block: "sms.send", input: { text: "Hi" } }],
    };

    const first = await runner.startDocument(plan, {}, ORIGIN, { key: "pln_1" });
    const again = await runner.startDocument(plan, {}, ORIGIN, { key: "pln_1" });

    expect(first).toMatch(/^wfr_/);
    expect(again).toBeUndefined();
    expect(calls).toHaveLength(1);
    await expect(
      runner.startDocument({ key: "ai.plan", steps: [] }, {}, ORIGIN),
    ).rejects.toBeInstanceOf(AutomationInvalidError);
  });

  it("calls a for-each step's block once per item, each with its own key, and keeps the results in order", async () => {
    const { runner, calls } = documentEngine();
    const id = await runner.startDocument(
      EACH,
      { buyers: [{ phone: "+9661" }, { phone: "+9662" }] },
      ORIGIN,
    );

    expect(calls.map((call) => call.input)).toEqual([
      { to: "+9661", text: "Shipped" },
      { to: "+9662", text: "Shipped" },
    ]);
    expect(calls.map((call) => call.request["idempotencyKey"])).toEqual([
      `${id}:notify:0`,
      `${id}:notify:1`,
    ]);
    expect(calls[0]?.request["callId"]).toBe(`${id}:notify:0`);
    const run = id === undefined ? undefined : await runner.find(id);
    expect(run?.steps[0]?.result).toEqual([{ messageId: "msg_1" }, { messageId: "msg_2" }]);
  });

  it("refuses a for-each list longer than the configured limit, or no list, calling nothing", async () => {
    const { runner, calls } = documentEngine({ forEachLimit: 1 });

    await expect(
      runner.startDocument(EACH, { buyers: [{ phone: "+9661" }, { phone: "+9662" }] }, ORIGIN),
    ).rejects.toBeInstanceOf(ForEachItemsInvalidError);
    await expect(runner.startDocument(EACH, { buyers: "all" }, ORIGIN)).rejects.toBeInstanceOf(
      ForEachItemsInvalidError,
    );
    expect(calls).toHaveLength(0);
  });

  it("continues the chain of the run a step key names, and stops a loop or a chain past its depth", async () => {
    const { runner } = documentEngine({ maxChainDepth: 2 });
    const plan = {
      key: "ai.plan",
      steps: [{ name: "notify", block: "sms.send", input: { text: "Hi" } }],
    };
    const root = await runner.startDocument(plan, {}, ORIGIN, {
      chain: { depth: 1, automations: ["wfa_1"] },
    });

    expect(await runner.chained("evt_1", "wfa_1")).toEqual({ depth: 1, automations: ["wfa_1"] });
    const second = await runner.chained(`${root}:notify`, "wfa_2");
    expect(second).toEqual({ depth: 2, automations: ["wfa_1", "wfa_2"] });
    expect(await runner.chained(`${root}:notify`, "wfa_1")).toBeUndefined();

    if (second === undefined) throw new Error("the chain was joined");
    const child = await runner.startDocument(plan, {}, ORIGIN, { key: "child", chain: second });
    expect(await runner.chained(`${child}:notify:0`, "wfa_3")).toBeUndefined();
  });

  it("keeps a run's automation, announces its start and end, and cancels it while it waits", async () => {
    const automation = "wfa_0000000000000000000000000a";
    const dispatched: object[] = [];
    const bus = {
      dispatch: (event: object) => void dispatched.push(event),
      drain: async () => [],
    };
    const pipeline = { execute: async () => ({ messageId: "msg_1" }) };
    const { runner, journal } = engineWith([
      [ActionPipeline, pipeline],
      [EventBus, bus],
    ]);
    const id = await runner.startDocument(
      COD,
      { orderId: "ord_1", answer: "pending" },
      { ...ORIGIN, scope: SCOPE },
      { automation },
    );
    if (id === undefined) throw new Error("no run started");

    expect((await runner.find(id))?.automation).toBe(automation);
    expect((await journal.byAutomation(automation, 10)).map((run) => run.id)).toEqual([id]);
    expect(dispatched).toEqual([
      expect.objectContaining({
        runId: id,
        workflow: "workflow.document",
        automationId: automation,
      }),
    ]);
    expect(dispatched[0]).toBeInstanceOf(WorkflowRunStarted);

    expect(await runner.cancel(id, "Bulk cancel")).toBe(true);
    const cancelled = await runner.find(id);
    expect(cancelled).toMatchObject({
      status: WorkflowRunStatus.Cancelled,
      error: { code: "workflow_cancelled", message: "Bulk cancel" },
    });
    expect(dispatched.at(-1)).toBeInstanceOf(WorkflowRunEnded);
    expect(dispatched.at(-1)).toMatchObject({ status: WorkflowRunStatus.Cancelled });

    await runner.hold(CodConfirmed, { orderId: "ord_1", answer: "yes" }, "ord_1");
    expect(await runner.tick(plus(1))).toBe(0);
    expect(await runner.cancel(id)).toBe(false);
    expect(await runner.cancel("wfr_missing")).toBe(false);
  });

  it("resumes a run on its pinned version, and waits while that version is not deployed", async () => {
    class PinnedWorkflow extends Workflow({}) {
      @Step({
        waitFor: Confirmed,
        correlate: () => "pin",
      })
      async confirm(): Promise<string> {
        return "v1";
      }
    }
    class PinnedV2Workflow extends Workflow({ version: 2 }) {
      async confirm(): Promise<string> {
        return "v2";
      }
    }
    registerWorkflows([
      { type: PinnedWorkflow, key: "test.pinned" },
      { type: PinnedV2Workflow, key: "test.pinned" },
    ]);
    const { runner, journal } = engineWith([
      [PinnedWorkflow, new PinnedWorkflow()],
      [PinnedV2Workflow, new PinnedV2Workflow()],
    ]);
    await runner.start(PinnedWorkflow, {}, ORIGIN);
    const parked = await runner.last(PinnedWorkflow);
    expect(parked?.version).toBe(1);

    await runner.hold(Confirmed, { by: "usr_1" }, "pin");
    await journal.save({ ...(parked as WorkflowRun), version: 9 });
    expect(await runner.tick(plus(1))).toBe(0);

    await journal.save(parked as WorkflowRun);
    expect(await runner.tick(plus(1))).toBe(1);
    expect((await runner.find((parked as WorkflowRun).id))?.steps.at(-1)?.result).toBe("v1");
  });
});
