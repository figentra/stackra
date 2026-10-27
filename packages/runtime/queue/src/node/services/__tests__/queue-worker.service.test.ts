/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueWorkerService`: a due job runs through the real pipeline as the system actor on behalf
 *          of its caller and is removed; a retryable failure waits for its backoff and is dead-lettered after the last
 *          attempt with one `onDeadLetter` call; a refusal that is not retryable ends the job at once; a job without a
 *          dead letter is dropped and logged; a queued call runs as its caller under its Idempotency-Key; a job
 *          derives its own key when a store is bound; an attempt past its timeout is aborted and retried; an unknown
 *          key is dead-lettered; a scoped job runs in its scope session with its scope as the call's (`ctx.scope`);
 *          `work` loops until aborted.
 * Boundary: test only; the memory driver, a fixed clock and a map resolver with an allowing `AccessControl`. Fake timers
 *           only in the timeout test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decisions 1 and 3); ADR 0305 (rules 28 and 30); ADR 0136
 *                     (decision 3); ADR 0327 (decision 6).
 */
import {
  Action,
  type ActionContext,
  MemoryIdempotencyStoreDriver,
  type Resolver,
} from "@stackra/actions";
import { AccessControl, IdempotencyStore } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock, Duration, Logger, Realm } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { ErrorKind, isRefusal, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { JobStatus } from "#contracts/index";
import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";
import { Backoff } from "#core/enums/backoff.enum";
import { JobOutcome } from "#core/enums/job-outcome.enum";
import { JobTimedOutError } from "#core/errors/job-timed-out.error";
import { UnknownJobError } from "#core/errors/unknown-job.error";
import { QueueService } from "#core/services/queue.service";
import { QueueWorkerService } from "#node/services/queue-worker.service";

const NOON = new Date(Date.UTC(2026, 9, 24, 12));

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOON.getTime());
  }
}

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class RecordingLogger extends Logger {
  readonly errors: string[] = [];

  debug(): void {}

  info(): void {}

  warn(): void {}

  error(event: string): void {
    this.errors.push(event);
  }
}

class ProviderDownError extends Refusal({ kind: ErrorKind.Unavailable }) {}

class MessageGoneError extends Refusal({ kind: ErrorKind.NotFound }) {}

class DeliverMessageAction extends Action({
  key: "message.deliver",
  actors: [ActorKind.System],
  job: {
    queue: "delivery",
    retries: 2,
    backoff: Backoff.Fixed,
    deadLetter: true,
    onDeadLetter: "markFailed",
  },
}) {
  readonly contexts: ActionContext[] = [];

  readonly failed: unknown[] = [];

  outcome: "sent" | "down" | "gone" = "sent";

  async handle(input: { messageId: string }, ctx: ActionContext): Promise<{ sent: string }> {
    this.contexts.push(ctx);
    if (this.outcome === "down") throw ProviderDownError.create();
    if (this.outcome === "gone") throw MessageGoneError.create();
    return { sent: input.messageId };
  }

  async markFailed(input: unknown): Promise<void> {
    this.failed.push(input);
  }
}

class PingAction extends Action({
  key: "ping.send",
  actors: [ActorKind.Job],
  job: { retries: 0 },
}) {
  async handle(): Promise<never> {
    throw new Error("bug");
  }
}

class HangAction extends Action({
  key: "hang.run",
  actors: [ActorKind.System],
  job: { timeout: "1s", retries: 1 },
}) {
  signal: AbortSignal | undefined;

  async handle(_input: object, ctx: ActionContext): Promise<never> {
    this.signal = ctx.abortSignal;
    return new Promise<never>(() => {});
  }
}

class VoidPaymentAction extends Action({
  key: "payment.void",
  actors: [ActorKind.User],
}) {
  readonly contexts: ActionContext[] = [];

  async handle(_input: { paymentId: string }, ctx: ActionContext): Promise<void> {
    this.contexts.push(ctx);
  }
}

const caller: Actor = { kind: ActorKind.Service, id: "svc_commerce", scopeId: "org_1" };

const user: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer };

/** A resolver over fixed instances. */
function resolverOf(entries: readonly (readonly [AnyClass, object])[]): Resolver {
  const instances = new Map<AnyClass, object>(entries);
  return {
    has: (token) => instances.has(token),
    get: <T extends object>(token: AnyClass<T>): T => {
      const instance = instances.get(token);
      if (instance === undefined) throw new Error(`${token.name} is not bound`);
      return instance as T;
    },
  };
}

/** A connected worker over a memory driver, with the actions above bound. */
function setup(extra: readonly (readonly [AnyClass, object])[] = []) {
  const clock = new FixedClock();
  const driver = new MemoryQueueDriver();
  const queue = new QueueService(driver, clock);
  const worker = new QueueWorkerService(driver, clock);
  const deliver = new DeliverMessageAction();
  const hang = new HangAction();
  const voidPayment = new VoidPaymentAction();
  const logger = new RecordingLogger();
  worker.connect(
    resolverOf([
      [AccessControl, new AllowAll()],
      [Logger, logger],
      [DeliverMessageAction, deliver],
      [PingAction, new PingAction()],
      [HangAction, hang],
      [VoidPaymentAction, voidPayment],
      ...extra,
    ]),
  );
  return { clock, driver, queue, worker, deliver, hang, voidPayment, logger };
}

describe(QueueWorkerService, () => {
  it("runs a due job as the system actor on behalf of its caller, then removes it", async () => {
    const { queue, worker, deliver } = setup();
    const id = await queue.push(DeliverMessageAction, { messageId: "msg_1" }, { origin: caller });
    const [run] = await worker.drain();
    expect(run).toMatchObject({ outcome: JobOutcome.Done, output: { sent: "msg_1" } });
    expect(deliver.contexts[0]?.actor).toEqual({
      kind: ActorKind.System,
      id,
      scopeId: "org_1",
      onBehalfOf: caller,
    });
    expect(deliver.contexts[0]?.idempotencyKey).toBeUndefined();
    expect(await worker.drain()).toEqual([]);
  });

  it("retries after the backoff, then dead-letters after the last attempt and calls onDeadLetter once", async () => {
    const { queue, worker, deliver } = setup();
    deliver.outcome = "down";
    const id = await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    const [first] = await worker.drain();
    expect(first?.outcome).toBe(JobOutcome.Retried);
    const wait = (first?.retryAt?.getTime() ?? 0) - NOON.getTime();
    expect(wait).toBeGreaterThanOrEqual(10_000);
    expect(wait).toBeLessThanOrEqual(15_000);
    expect(await worker.drain()).toEqual([]);
    const [second] = await worker.drain(undefined, first?.retryAt);
    expect(second).toMatchObject({ outcome: JobOutcome.Retried, job: { attempts: 2 } });
    const [third] = await worker.drain(undefined, second?.retryAt);
    expect(third).toMatchObject({ outcome: JobOutcome.DeadLettered, job: { attempts: 3 } });
    expect(deliver.failed).toEqual([{ messageId: "msg_1" }]);
    expect(await queue.deadLetters("delivery")).toMatchObject([
      { id, status: JobStatus.Dead, lastError: { code: "provider_down" } },
    ]);
  });

  it("ends a job at once on a refusal that is not retryable", async () => {
    const { queue, worker, deliver } = setup();
    deliver.outcome = "gone";
    await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    const [run] = await worker.drain();
    expect(run).toMatchObject({ outcome: JobOutcome.DeadLettered, job: { attempts: 1 } });
    expect(isRefusal(run?.error, MessageGoneError)).toBe(true);
  });

  it("drops a failed job without a dead letter and logs it, running it as the job actor it lists", async () => {
    const { queue, worker, logger } = setup();
    await queue.push(PingAction, {});
    const [run] = await worker.drain();
    expect(run?.outcome).toBe(JobOutcome.Dropped);
    expect(logger.errors).toEqual(["queue.job_dropped"]);
    expect(await queue.deadLetters()).toEqual([]);
    expect(await worker.drain()).toEqual([]);
  });

  it("runs a queued call of an action without a job option as its caller, under its Idempotency-Key", async () => {
    const { queue, worker, voidPayment } = setup([
      [IdempotencyStore, new MemoryIdempotencyStoreDriver(new FixedClock())],
    ]);
    await queue.push(
      VoidPaymentAction,
      { paymentId: "pay_1" },
      { origin: user, idempotencyKey: "k1" },
    );
    const [run] = await worker.drain();
    expect(run?.outcome).toBe(JobOutcome.Done);
    expect(voidPayment.contexts[0]?.actor).toBe(user);
    expect(voidPayment.contexts[0]?.idempotencyKey).toBe("k1");
  });

  it("derives a job's Idempotency-Key from its id when a store is bound", async () => {
    const { queue, worker, deliver } = setup([
      [IdempotencyStore, new MemoryIdempotencyStoreDriver(new FixedClock())],
    ]);
    const id = await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    await worker.drain();
    expect(deliver.contexts[0]?.idempotencyKey).toBe(`job:${id}`);
  });

  it("aborts an attempt past its timeout and retries it", async () => {
    vi.useFakeTimers();
    try {
      const { queue, worker, hang } = setup();
      await queue.push(HangAction, {});
      const drained = worker.drain();
      await vi.advanceTimersByTimeAsync(1_000);
      const [run] = await drained;
      expect(run?.outcome).toBe(JobOutcome.Retried);
      expect(isRefusal(run?.error, JobTimedOutError)).toBe(true);
      expect(hang.signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("dead-letters a job whose key this process does not know", async () => {
    const { driver, worker } = setup();
    await driver.push({
      id: "job_unknown",
      queue: "delivery",
      key: "gone.action@1",
      input: {},
      status: JobStatus.Waiting,
      attempts: 0,
      runAt: NOON,
      lease: Duration.minutes(6),
    });
    const [run] = await worker.drain();
    expect(run?.outcome).toBe(JobOutcome.DeadLettered);
    expect(isRefusal(run?.error, UnknownJobError)).toBe(true);
    expect(await driver.deadLetters(undefined, 10)).toMatchObject([
      { id: "job_unknown", lastError: { code: "unknown_job" } },
    ]);
  });

  it("runs a scoped job in its scope session, with its scope as the call's", async () => {
    const withScope = vi.fn(async (_scope: unknown, work: () => Promise<unknown>) => work());
    const current = vi
      .spyOn(Database, "current")
      .mockReturnValue({ withScope } as unknown as Database);
    try {
      const { queue, worker, deliver } = setup();
      const scope = { id: "scp_1", path: "platform.acme" } as const;
      await queue.push(DeliverMessageAction, { messageId: "msg_1" }, { scope });
      const [run] = await worker.drain();
      expect(run?.outcome).toBe(JobOutcome.Done);
      expect(withScope).toHaveBeenCalledWith(scope, expect.any(Function));
      expect(deliver.contexts[0]?.scope).toEqual(scope);
    } finally {
      current.mockRestore();
    }
  });

  it("processes a job the caller reserved", async () => {
    const { driver, queue, worker } = setup();
    await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    const job = await driver.reserve("delivery", NOON);
    if (job === undefined) throw new Error("not reserved");
    await expect(worker.process(job)).resolves.toMatchObject({ outcome: JobOutcome.Done });
  });

  it("hands a delivered job to the driver's claim before it runs", async () => {
    const { driver, queue, worker } = setup();
    await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    const job = await driver.reserve("delivery", NOON);
    if (job === undefined) throw new Error("not reserved");
    const claim = vi.spyOn(driver, "claim");
    await expect(worker.process(job)).resolves.toMatchObject({ outcome: JobOutcome.Done });
    expect(claim).toHaveBeenCalledWith(job, expect.any(Date));
  });

  it("works a queue until aborted", async () => {
    const { queue, worker, deliver } = setup();
    await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    const controller = new AbortController();
    const working = worker.work("delivery", { signal: controller.signal, concurrency: 2 });
    await vi.waitFor(() => expect(deliver.contexts).toHaveLength(1));
    controller.abort();
    await expect(working).resolves.toBeUndefined();
    await expect(
      worker.work("delivery", { signal: controller.signal, concurrency: 0 }),
    ).rejects.toThrow(RangeError);
  });

  it("refuses to run before it is connected", async () => {
    const worker = new QueueWorkerService(new MemoryQueueDriver(), new FixedClock());
    await expect(worker.drain()).rejects.toThrow(/not connected/);
  });
});
