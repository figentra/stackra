/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueWorkerService`: a due job runs through the real pipeline as the system actor on behalf
 *          of its caller and is removed; a retryable failure waits for its backoff and is dead-lettered after the last
 *          attempt with one `onDeadLetter` call, each attempt's `ctx.attempt` saying its number and whether it is the
 *          last; a refusal that is not retryable ends the job at once; a job without a
 *          dead letter is dropped and logged; a queued call runs as its caller under its Idempotency-Key; a job
 *          derives its own key when a store is bound; an attempt past its timeout is aborted and retried; an unknown
 *          key is dead-lettered; a scoped job runs through the bound `CallIsolation` with its scope as the call's (`ctx.scope`) and is dead-lettered at once, its hook not run, when none is bound (`job_isolation_missing`);
 *          `work` loops until aborted; a throttled job waits for its next token without counting the attempt (and fails
 *          its attempt when no `RateLimitStore` is bound); a chain runs its links in order; a batch counts done and
 *          failed jobs. Across owners: a claimed job loads, settles and queues its next link in its owner (the link in a
 *          `requiresNew` transaction), an owned job with no isolation bound or a claim that does not load fails the
 *          drain and never runs, and a delivered job's row work runs in its own scope's isolation.
 * Boundary: test only; the memory driver, a fixed clock and a map resolver with an allowing `AccessControl`. Fake timers
 *           only in the timeout test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decisions 1 and 3); ADR 0305 (rules 28 and 30); ADR 0136
 *                     (decision 3); ADR 0327 (decision 6); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import {
  Action,
  type ActionContext,
  MemoryIdempotencyStoreDriver,
  MemoryRateLimitStoreDriver,
  type Resolver,
} from "@stackra/actions";
import {
  AccessControl,
  CallIsolation,
  IdempotencyStore,
  RateLimitStore,
} from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { type Actor, ActorKind, Backoff, Clock, Duration, Logger, Realm } from "@stackra/contracts";
import { ErrorKind, isRefusal, Refusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Database } from "@stackra/database";

import { JobStatus } from "#contracts/index";
import type { QueuedJob } from "#contracts/index";
import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";
import { JobOutcome } from "#core/enums/job-outcome.enum";
import { JobClaimNotLoadedError } from "#core/errors/job-claim-not-loaded.error";
import { JobIsolationMissingError } from "#core/errors/job-isolation-missing.error";
import { JobRowIsolationMissingError } from "#core/errors/job-row-isolation-missing.error";
import { JobTimedOutError } from "#core/errors/job-timed-out.error";
import { UnknownJobError } from "#core/errors/unknown-job.error";
import { QueueService } from "#core/services/queue.service";
import type { JobFairnessOptions } from "#core/types/job-fairness-options.type";
import { QueueWorkerService } from "#node/services/queue-worker.service";

const NOON = new Date(Date.UTC(2026, 9, 24, 12));

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOON);
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

// Typed apart until @stackra/actions' `JobOptions` lists the fairness fields (stackra-278 integration ask).
const THROTTLED_JOB: JobFairnessOptions & { readonly queue: string } = {
  queue: "payments",
  throttle: { perMinute: 1, key: "stripe" },
};

class ChargeCardAction extends Action({
  key: "card.charge",
  actors: [ActorKind.System],
  job: THROTTLED_JOB,
}) {
  async handle(input: { cardId: string }): Promise<{ charged: string }> {
    return { charged: input.cardId };
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

/** The job `driver` reserves of `queue` at `now`, loaded as its claim names it. */
async function reserved(
  driver: MemoryQueueDriver,
  queue: string | undefined,
  now: Date,
): Promise<QueuedJob | undefined> {
  const claim = await driver.reserve(queue, now);
  return claim === undefined ? undefined : driver.load(claim.id);
}

/** An isolation that records each unit's actor and scope and runs it. */
class RecordingIsolation extends Driver(CallIsolation) {
  readonly runs: [Actor, unknown][] = [];

  run<T>(actor: Actor, scope: unknown, work: () => Promise<T>): Promise<T> {
    this.runs.push([actor, scope]);
    return work();
  }
}

/** A memory driver whose every reservation claims owner `owner`, as the Postgres driver does for a tenant's job. */
function ownedDriver(owner: string): MemoryQueueDriver {
  const driver = new MemoryQueueDriver();
  const reserve = driver.reserve.bind(driver);
  driver.reserve = async (queue, now) => {
    const claim = await reserve(queue, now);
    return claim === undefined ? undefined : { ...claim, ownerId: owner as never };
  };
  return driver;
}

/** A connected worker over a memory driver, with the actions above bound. */
function setup(
  extra: readonly (readonly [AnyClass, object])[] = [],
  driver: MemoryQueueDriver = new MemoryQueueDriver(),
) {
  const clock = new FixedClock();
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
      [ChargeCardAction, new ChargeCardAction()],
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

  it("runs a job queued by an agent with no tenant of its own in the tenant of the human it acts for", async () => {
    const { queue, worker, deliver } = setup();
    const agent: Actor = {
      kind: ActorKind.Agent,
      id: "agt_1",
      onBehalfOf: { ...user, scopeId: "org_1" },
    };
    const id = await queue.push(DeliverMessageAction, { messageId: "msg_1" }, { origin: agent });
    await worker.drain();
    expect(deliver.contexts[0]?.actor).toEqual({
      kind: ActorKind.System,
      id,
      scopeId: "org_1",
      onBehalfOf: agent,
    });
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
    // each attempt knows its number and whether a retry follows (retries: 2, so the third is the last)
    expect(deliver.contexts.map((ctx) => ctx.attempt)).toEqual([
      { number: 1, last: false },
      { number: 2, last: false },
      { number: 3, last: true },
    ]);
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

  it("runs the attempt and the dead-letter hook through a bound CallIsolation as the job's actor and scope, with no scope session of its own", async () => {
    const runs: [Actor, unknown, boolean][] = [];
    class Recording extends Driver(CallIsolation) {
      run<T>(
        actor: Actor,
        scope: unknown,
        work: () => Promise<T>,
        options: { readonly readOnly: boolean },
      ): Promise<T> {
        runs.push([actor, scope, options.readOnly]);
        return work();
      }
    }
    const { queue, worker, deliver } = setup([[CallIsolation, new Recording()]]);
    deliver.outcome = "gone";
    const scope = { id: "scp_1", path: "platform.acme" } as const;
    const id = await queue.push(
      DeliverMessageAction,
      { messageId: "msg_1" },
      { origin: caller, scope },
    );
    await worker.drain();
    const expected = { kind: ActorKind.System, id, scopeId: "org_1", onBehalfOf: caller };
    const row = { kind: ActorKind.System, id: "sys_queue_worker" };
    // the load, the pipeline's own isolation of the attempt, the dead letter in the job's owner (memory keeps none:
    // the platform's), then the worker's isolation of the hook
    expect(runs).toEqual([
      [row, undefined, false],
      [expected, scope, false],
      [row, undefined, false],
      [expected, scope, false],
    ]);
    expect(deliver.failed).toEqual([{ messageId: "msg_1" }]);
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
      await vi.advanceTimersByTimeAsync(1000);
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

  it("runs a scoped job through the bound CallIsolation, with its scope as the call's, even with no origin", async () => {
    const runs: [Actor, unknown][] = [];
    class Recording extends Driver(CallIsolation) {
      run<T>(actor: Actor, scope: unknown, work: () => Promise<T>): Promise<T> {
        runs.push([actor, scope]);
        return work();
      }
    }
    const { queue, worker, deliver } = setup([[CallIsolation, new Recording()]]);
    const scope = { id: "scp_1", path: "platform.acme" } as const;
    await queue.push(DeliverMessageAction, { messageId: "msg_1" }, { scope });
    const [run] = await worker.drain();
    expect(run?.outcome).toBe(JobOutcome.Done);
    expect(deliver.contexts[0]?.scope).toEqual(scope);
    // no tenant is written here: the isolation driver derives it from the scope (`@stackra/tenancy`)
    const attempt = runs.find(([actor]) => actor.id !== "sys_queue_worker");
    expect(attempt?.[0]).toMatchObject({ kind: ActorKind.System });
    expect(attempt?.[0]?.scopeId).toBeUndefined();
    expect(attempt?.[1]).toEqual(scope);
  });

  it("dead-letters a scoped job at once when no CallIsolation is bound, instead of running it with no tenant", async () => {
    const { driver, queue, worker, deliver } = setup();
    const scope = { id: "scp_1", path: "platform.acme" } as const;
    await queue.push(DeliverMessageAction, { messageId: "msg_1" }, { scope });
    const [run] = await worker.drain();
    expect(run).toMatchObject({ outcome: JobOutcome.DeadLettered, job: { attempts: 1 } });
    expect(isRefusal(run?.error, JobIsolationMissingError)).toBe(true);
    expect(deliver.contexts).toEqual([]);
    expect(await driver.deadLetters(undefined, 10)).toMatchObject([
      { lastError: { code: "job_isolation_missing" } },
    ]);
  });

  it("does not run the dead-letter hook of a scoped job when no CallIsolation is bound, and logs it", async () => {
    const { queue, worker, deliver, logger } = setup();
    deliver.outcome = "gone";
    const scope = { id: "scp_1", path: "platform.acme" } as const;
    await queue.push(DeliverMessageAction, { messageId: "msg_1" }, { scope });
    await worker.drain();
    expect(deliver.failed).toEqual([]);
    expect(logger.errors).toEqual(["queue.dead_letter_hook_failed"]);
  });

  it("still runs a job with no scope as a platform call when no CallIsolation is bound", async () => {
    const { queue, worker, deliver } = setup();
    await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    const [run] = await worker.drain();
    expect(run?.outcome).toBe(JobOutcome.Done);
    expect(deliver.contexts[0]?.scope).toBeUndefined();
  });

  it("processes a job the caller reserved", async () => {
    const { driver, queue, worker } = setup();
    await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    const job = await reserved(driver, "delivery", NOON);
    if (job === undefined) throw new Error("not reserved");
    await expect(worker.process(job)).resolves.toMatchObject({ outcome: JobOutcome.Done });
  });

  it("hands a delivered job to the driver's claim before it runs", async () => {
    const { driver, queue, worker } = setup();
    await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    const job = await reserved(driver, "delivery", NOON);
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

  it("throttles a job: the second waits for the next token and its attempt is not counted", async () => {
    const { driver, queue, worker } = setup([[RateLimitStore, new MemoryRateLimitStoreDriver()]]);
    await queue.push(ChargeCardAction, { cardId: "crd_1" });
    await queue.push(ChargeCardAction, { cardId: "crd_2" });
    const [first, second] = await worker.drain("payments");
    expect(first?.outcome).toBe(JobOutcome.Done);
    expect(second?.outcome).toBe(JobOutcome.Throttled);
    const retryAt = second?.retryAt ?? NOON;
    expect(retryAt.getTime()).toBeGreaterThan(NOON.getTime());
    expect(await reserved(driver, "payments", retryAt)).toMatchObject({ attempts: 1 });
  });

  it("fails a throttled attempt when no RateLimitStore is bound", async () => {
    const { queue, worker } = setup();
    await queue.push(ChargeCardAction, { cardId: "crd_1" });
    const [run] = await worker.drain("payments");
    expect(run?.outcome).toBe(JobOutcome.Retried);
    expect(String(run?.error)).toMatch(/RateLimitStore/);
  });

  it("runs a chain's links in order, each once the one before it is done", async () => {
    const { queue, worker, deliver } = setup();
    await queue.chain([
      { type: DeliverMessageAction, input: { messageId: "msg_1" } },
      { type: DeliverMessageAction, input: { messageId: "msg_2" } },
    ]);
    const runs = await worker.drain("delivery");
    expect(runs.map((run) => [run.outcome, run.output])).toEqual([
      [JobOutcome.Done, { sent: "msg_1" }],
      [JobOutcome.Done, { sent: "msg_2" }],
    ]);
    expect(deliver.contexts).toHaveLength(2);
  });

  it("counts a batch's done and failed jobs", async () => {
    const { queue, worker } = setup();
    const { id } = await queue.batch([
      { type: DeliverMessageAction, input: { messageId: "msg_1" } },
      { type: PingAction, input: {} },
    ]);
    await worker.drain();
    expect(await queue.progress(id)).toEqual({ id, total: 2, done: 1, failed: 1 });
  });

  it("loads, settles and chains an owned job in its owner, the next link in a transaction of its own", async () => {
    const isolation = new RecordingIsolation();
    const transactions: unknown[] = [];
    const database = {
      transaction: (work: () => Promise<unknown>, options: unknown) => {
        transactions.push(options);
        return work();
      },
    };
    const { queue, worker } = setup(
      [
        [CallIsolation, isolation],
        [Database, database],
      ],
      ownedDriver("scp_acme"),
    );
    await queue.chain([
      { type: DeliverMessageAction, input: { messageId: "msg_1" } },
      { type: DeliverMessageAction, input: { messageId: "msg_2" } },
    ]);
    const runs = await worker.drain("delivery");
    expect(runs.map((run) => run.outcome)).toEqual([JobOutcome.Done, JobOutcome.Done]);
    const owned = { kind: ActorKind.System, id: "sys_queue_worker", scopeId: "scp_acme" };
    // per job: the load, the attempt (the pipeline's), the removal; the first also pushes its next link
    expect(isolation.runs.filter(([actor]) => actor.id === "sys_queue_worker")).toEqual([
      [owned, undefined],
      [owned, undefined],
      [owned, undefined],
      [owned, undefined],
      [owned, undefined],
    ]);
    expect(transactions).toEqual([{ requiresNew: true }]);
  });

  it("refuses an owned job when no CallIsolation is bound, and never runs or skips it", async () => {
    const { queue, worker, deliver, driver } = setup([], ownedDriver("scp_acme"));
    const id = await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    await expect(worker.drain()).rejects.toBeInstanceOf(JobRowIsolationMissingError);
    expect(deliver.contexts).toEqual([]);
    expect(await driver.load(id ?? "job_x")).toMatchObject({ status: JobStatus.Running });
  });

  it("fails a reserved job that does not load in its owner", async () => {
    const { queue, worker, driver, deliver } = setup([[CallIsolation, new RecordingIsolation()]]);
    await queue.push(DeliverMessageAction, { messageId: "msg_1" });
    driver.load = async () => undefined;
    await expect(worker.drain()).rejects.toBeInstanceOf(JobClaimNotLoadedError);
    expect(deliver.contexts).toEqual([]);
  });

  it("keeps a delivered job's row work in its own scope's isolation", async () => {
    const isolation = new RecordingIsolation();
    const { driver, queue, worker, deliver } = setup([[CallIsolation, isolation]]);
    deliver.outcome = "gone";
    const scope = { id: "scp_1", path: "platform.acme" } as const;
    await queue.push(DeliverMessageAction, { messageId: "msg_1" }, { origin: caller, scope });
    const job = await reserved(driver, "delivery", NOON);
    if (job === undefined) throw new Error("not reserved");
    await expect(worker.process(job)).resolves.toMatchObject({
      outcome: JobOutcome.DeadLettered,
    });
    expect(isolation.runs).toContainEqual([
      { kind: ActorKind.System, id: "sys_queue_worker" },
      scope,
    ]);
  });
});
