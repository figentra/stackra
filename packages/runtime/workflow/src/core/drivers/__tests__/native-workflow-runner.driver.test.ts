/**
 * Stackra file contract:
 * Purpose: unit tests of `NativeWorkflowRunnerDriver`, the engine's conformance on the memory journal: steps run in
 *          order with their results kept for later steps and `output`; a refused step undoes the completed steps last
 *          first and rejects with the refusal; a failing step is retried within its budget with its progress kept; a
 *          `when` skips; a failing undo leaves the run failed; a signal wait parks the run, answers with the output so
 *          far, and resumes on the matching signal (sent before or after it parked), or times out and compensates;
 *          `startOn` runs once per key; the context carries the call, the step key and the clock, and recorded events
 *          go to the outbox or the bus; a tick takes over a run whose runner died; the port methods delegate.
 * Boundary: test only; the memory journal and lock driver, a settable clock, a map resolver, recording stand-ins for
 *           the outbox, the bus and the context storage. `backoffDelay` is mocked to zero so a retry does not wait.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0102 (decisions 1, 2 and 7); ADR 0151 (decision 6: conformance);
 *                     ADR 0152 (0294 note).
 */
import type { Resolver } from "@stackra/actions";
import { ContextStorage, WorkflowRunner } from "@stackra/actions/contracts";
import type { CallDescriptor } from "@stackra/actions/contracts";
import type { AnyClass } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import type { Actor, Clock } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { DomainEvent, EventBus, IntegrationEvent } from "@stackra/events";
import { EventOutbox } from "@stackra/events/contracts";
import type { RecordedEvent } from "@stackra/events/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Signal } from "#core/bases/signal.base";
import { Workflow } from "#core/bases/workflow.base";
import { Step } from "#core/decorators/step.decorator";
import { MemoryWorkflowJournalDriver } from "#core/drivers/memory-workflow-journal.driver";
import { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import { StepStatus } from "#core/enums/step-status.enum";
import { WorkflowRunStatus } from "#core/enums/workflow-run-status.enum";
import type { Run } from "#core/types/run.type";
import type { RunOrigin } from "#core/types/run-origin.type";
import type { StepContext } from "#core/types/step-context.type";

vi.mock("@stackra/queue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@stackra/queue")>()),
  backoffDelay: () => 0,
}));

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** `minutes` after noon. */
const plus = (minutes: number): Date => new Date(NOON.getTime() + minutes * 60_000);

const ACTOR: Actor = { kind: ActorKind.System, id: "sys_test" };

const ORIGIN: RunOrigin = {
  callId: "call-1",
  key: "order.place",
  actor: ACTOR,
  locale: "en",
  timeZone: "UTC",
  currency: "USD",
  market: "default",
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
      return new Date(this.at.getTime());
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

/** An engine on a fresh memory journal, connected to `entries`. */
function engineWith(entries: readonly (readonly [AnyClass, object])[]) {
  const clock = clockAt(NOON);
  const journal = new MemoryWorkflowJournalDriver();
  const runner = new NativeWorkflowRunnerDriver(
    journal,
    new Locks(new MemoryLockDriver(), clock),
    clock,
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

  it("retries a failing step within its budget, with the progress it reported", async () => {
    const order = new OrderWorkflow();
    order.failures.push(new TypeError("gateway timeout"));
    const { runner } = engineWith([[OrderWorkflow, order]]);

    await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN);

    const run = await runner.last(OrderWorkflow);
    expect(run?.status).toBe(WorkflowRunStatus.Completed);
    expect(run?.steps.at(-1)).toMatchObject({ attempts: 2, progress: { page: 1 } });
    expect(order.calls.filter((call) => call.startsWith("authorize"))).toEqual([
      "authorize:1:null",
      'authorize:2:{"page":1}',
    ]);
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

    await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN);

    expect(written).toHaveLength(1);
    expect(written[0]?.event).toBeInstanceOf(OrderPlaced);
    expect(written[0]?.meta).toMatchObject({
      actor: ACTOR,
      correlationId: "call-1",
      occurredAt: NOON,
    });
    expect(written[0]?.meta.id).toMatch(/^evt_/);
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]?.[0]).toBeInstanceOf(PointsDebited);
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
      area: ApiArea.App,
    };

    await runner.run(SkippingWorkflow, { gift: true }, call);

    const run = await runner.last(SkippingWorkflow);
    expect(run?.origin).toEqual({
      callId: "call-9",
      key: "orders.order.place@1",
      actor: ACTOR,
      locale: "ar-SA",
      timeZone: "Asia/Riyadh",
      currency: "SAR",
      market: "sa",
    });
    expect(seen).toHaveLength(2);
    expect(seen[0]).toMatchObject({ callId: "call-9", step: "wrap", attempt: 1, runId: run?.id });
  });

  it("holds a signal sent through the port", async () => {
    const { runner } = engineWith([[RedeemWorkflow, new RedeemWorkflow()]]);
    await runner.start(RedeemWorkflow, { memberId: "mem_1", points: 1 }, ORIGIN);

    await runner.signal(Confirmed, { by: "usr_1" }, { memberId: "mem_1" }, {} as CallDescriptor);
    await runner.tick(plus(1));

    expect((await runner.last(RedeemWorkflow))?.status).toBe(WorkflowRunStatus.Completed);
  });

  it("takes over a running run whose runner died", async () => {
    const order = new OrderWorkflow();
    const { runner, journal } = engineWith([[OrderWorkflow, order]]);
    await runner.start(OrderWorkflow, { sku: "sku_1", quantity: 1 }, ORIGIN);
    const finished = await runner.last(OrderWorkflow);
    if (finished === undefined) throw new Error("the run was recorded");
    await journal.save({
      ...finished,
      id: "wfr_orphan",
      status: WorkflowRunStatus.Running,
      steps: finished.steps.slice(0, 2),
    });
    order.calls.length = 0;

    expect(await runner.tick()).toBe(1);

    expect((await runner.find("wfr_orphan"))?.status).toBe(WorkflowRunStatus.Completed);
    expect(order.calls).toEqual(["create", "authorize:1:null"]);
  });

  it("refuses a signal class that is not a signal, and a run before connect", async () => {
    const { runner } = engineWith([]);
    class NotASignal {}
    await expect(runner.hold(NotASignal, {})).rejects.toBeInstanceOf(TypeError);
    const clock = clockAt(NOON);
    const unconnected = new NativeWorkflowRunnerDriver(
      new MemoryWorkflowJournalDriver(),
      new Locks(new MemoryLockDriver(), clock),
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
