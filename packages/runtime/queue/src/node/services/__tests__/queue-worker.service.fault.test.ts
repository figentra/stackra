/**
 * Stackra file contract:
 * Purpose: the fault-injection tests of `QueueWorkerService` (ADR 0182 decision 4), on the memory store with faults
 *          injected into the store and the provider a job calls. A provider that fails before acting is retried
 *          after its backoff until it answers, and acts once. A provider that acts and loses its answer is called
 *          again under the same Idempotency-Key, so it acts once. A store that cannot record a finished attempt (the
 *          remove fails, or removes and loses its answer) fails the drain instead of counting the attempt as the
 *          job's failure: the job is never retried, dead-lettered or compensated by `onDeadLetter` for work that
 *          succeeded, and once its lease lapses the next attempt replays the stored result. A store that cannot
 *          reserve, or cannot record a retry, fails the drain and loses nothing: the job runs once the store answers.
 * Boundary: test only; the memory driver wrapped by `injectFaults`, a fixed clock moved by `drain(at)`, a map resolver
 *           with an allowing `AccessControl` and the memory `IdempotencyStore`. The database faults of the same paths
 *           are in `queue-worker.service.fault.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 1 and 4: the fault-injection tests in the unit tier); ADR 0148 (decisions 1
 *                     and 3: retries, dead letters, a lapsed lease makes a job due again); ADR 0136 (decision 3: a job's
 *                     derived Idempotency-Key).
 */
import {
  Action,
  type ActionContext,
  MemoryIdempotencyStoreDriver,
  type Resolver,
} from "@stackra/actions";
import { AccessControl, IdempotencyStore } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { ActorKind, Backoff, Clock } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, InjectedFaultError, injectFaults, it } from "@stackra/testing";

import { JobStatus } from "#contracts/index";
import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";
import { JobOutcome } from "#core/enums/job-outcome.enum";
import { QueueService } from "#core/services/queue.service";
import { QueueWorkerService } from "#node/services/queue-worker.service";

const NOON = new Date(Date.UTC(2026, 10, 26, 12));

/** Past every lease of the jobs below (a 30 s timeout plus the minute of grace). */
const AFTER_LEASE = new Date(NOON.getTime() + 10 * 60_000);

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOON);
  }
}

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class ProviderDownError extends Refusal({ kind: ErrorKind.Unavailable }) {}

/** A provider that sends one message per Idempotency-Key, as a real one with idempotent requests does. */
class MessageProvider {
  readonly sent = new Map<string, string>();

  async send(key: string, to: string): Promise<{ readonly id: string }> {
    if (!this.sent.has(key)) this.sent.set(key, to);
    return { id: `snt_${this.sent.size}` };
  }
}

/** Sends one message through the provider under the attempt's Idempotency-Key; compensates on a dead letter. */
class SendMessageAction extends Action({
  key: "message.send",
  actors: [ActorKind.System],
  job: {
    queue: "sends",
    timeout: "30s",
    retries: 2,
    backoff: Backoff.Fixed,
    deadLetter: true,
    onDeadLetter: "markFailed",
  },
}) {
  static provider: MessageProvider;

  readonly runs: ActionContext[] = [];

  readonly failed: unknown[] = [];

  async handle(input: { to: string }, ctx: ActionContext): Promise<{ id: string }> {
    this.runs.push(ctx);
    return SendMessageAction.provider.send(ctx.idempotencyKey ?? "none", input.to);
  }

  async markFailed(input: unknown): Promise<void> {
    this.failed.push(input);
  }
}

/** The same send on its last attempt from the start: any failure would dead-letter it. */
class SendOnceAction extends Action({
  key: "message.send_once",
  actors: [ActorKind.System],
  job: {
    queue: "sends",
    timeout: "30s",
    retries: 0,
    deadLetter: true,
    onDeadLetter: "markFailed",
  },
}) {
  readonly runs: ActionContext[] = [];

  readonly failed: unknown[] = [];

  async handle(input: { to: string }, ctx: ActionContext): Promise<{ id: string }> {
    this.runs.push(ctx);
    return SendMessageAction.provider.send(ctx.idempotencyKey ?? "none", input.to);
  }

  async markFailed(input: unknown): Promise<void> {
    this.failed.push(input);
  }
}

/**
 * The id `QueueService.push` answered: a job with no unique key is always stored.
 *
 * @throws Error when the push stored nothing.
 */
function pushed(id: PublicId<"job"> | undefined): PublicId<"job"> {
  if (id === undefined) throw new Error("the job was not stored");
  return id;
}

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

/** A worker over `store`, the provider wrapped by `provider`, and both actions. */
function setup(store: MemoryQueueDriver, provider: MessageProvider = new MessageProvider()) {
  SendMessageAction.provider = provider;
  const clock = new FixedClock();
  const queue = new QueueService(store, clock);
  const worker = new QueueWorkerService(store, clock);
  const send = new SendMessageAction();
  const sendOnce = new SendOnceAction();
  worker.connect(
    resolverOf([
      [AccessControl, new AllowAll()],
      [IdempotencyStore, new MemoryIdempotencyStoreDriver(clock)],
      [SendMessageAction, send],
      [SendOnceAction, sendOnce],
    ]),
  );
  return { queue, worker, send, sendOnce };
}

describe("QueueWorkerService under injected faults", () => {
  it("retries a provider that fails before acting, and the message is sent once", async () => {
    const real = new MessageProvider();
    const provider = injectFaults(real, [
      { method: "send", calls: [1, 2], error: () => ProviderDownError.create() },
    ]);
    const { queue, worker, send } = setup(new MemoryQueueDriver(), provider.target);
    await queue.push(SendMessageAction, { to: "a@example.test" });
    const [first] = await worker.drain();
    expect(first?.outcome).toBe(JobOutcome.Retried);
    const [second] = await worker.drain(undefined, first?.retryAt);
    expect(second?.outcome).toBe(JobOutcome.Retried);
    const [third] = await worker.drain(undefined, second?.retryAt);
    expect(third?.outcome).toBe(JobOutcome.Done);
    expect(send.runs).toHaveLength(3);
    expect(real.sent.size).toBe(1);
    expect(send.failed).toEqual([]);
  });

  it("calls a provider that lost its answer again under the same Idempotency-Key, so it acts once", async () => {
    const real = new MessageProvider();
    const provider = injectFaults(real, [
      { method: "send", when: "after", error: () => ProviderDownError.create() },
    ]);
    const { queue, worker } = setup(new MemoryQueueDriver(), provider.target);
    const id = await queue.push(SendMessageAction, { to: "a@example.test" });
    const [first] = await worker.drain();
    expect(first?.outcome).toBe(JobOutcome.Retried);
    const [second] = await worker.drain(undefined, first?.retryAt);
    expect(second?.outcome).toBe(JobOutcome.Done);
    expect(provider.calls.map((call) => call.args[0])).toEqual([`job:${id}`, `job:${id}`]);
    expect([...real.sent.keys()]).toEqual([`job:${id}`]);
  });

  it("fails the drain when the store cannot record a finished attempt, and never dead-letters the work", async () => {
    const store = injectFaults(new MemoryQueueDriver(), [{ method: "remove" }]);
    const real = new MessageProvider();
    const { queue, worker, sendOnce } = setup(store.target, real);
    const id = pushed(await queue.push(SendOnceAction, { to: "a@example.test" }));
    await expect(worker.drain()).rejects.toBeInstanceOf(InjectedFaultError);
    // the attempt succeeded: no dead letter, no compensation, no retry recorded
    expect(sendOnce.failed).toEqual([]);
    expect(await queue.deadLetters("sends")).toEqual([]);
    expect(store.callsOf("retry")).toEqual([]);
    expect(store.callsOf("deadLetter")).toEqual([]);
    // the job stays reserved until its lease lapses, then the next attempt replays the stored result
    expect(await store.target.load(id)).toMatchObject({ status: JobStatus.Running, attempts: 1 });
    expect(await worker.drain()).toEqual([]);
    const [again] = await worker.drain(undefined, AFTER_LEASE);
    expect(again).toMatchObject({ outcome: JobOutcome.Done, output: { id: "snt_1" } });
    expect(sendOnce.runs).toHaveLength(1);
    expect(real.sent.size).toBe(1);
    expect(await store.target.load(id)).toBeUndefined();
  });

  it("fails the drain when the store removes the job and loses the answer, and runs nothing again", async () => {
    const store = injectFaults(new MemoryQueueDriver(), [{ method: "remove", when: "after" }]);
    const { queue, worker, sendOnce } = setup(store.target);
    const id = pushed(await queue.push(SendOnceAction, { to: "a@example.test" }));
    await expect(worker.drain()).rejects.toBeInstanceOf(InjectedFaultError);
    expect(await store.target.load(id)).toBeUndefined();
    expect(sendOnce.failed).toEqual([]);
    expect(await worker.drain(undefined, AFTER_LEASE)).toEqual([]);
    expect(sendOnce.runs).toHaveLength(1);
  });

  it("loses no job when the store cannot reserve: it runs once the store answers", async () => {
    const store = injectFaults(new MemoryQueueDriver(), [{ method: "reserve" }]);
    const { queue, worker, send } = setup(store.target);
    const id = pushed(await queue.push(SendMessageAction, { to: "a@example.test" }));
    await expect(worker.drain()).rejects.toBeInstanceOf(InjectedFaultError);
    expect(await store.target.load(id)).toMatchObject({ status: JobStatus.Waiting, attempts: 0 });
    const [run] = await worker.drain();
    expect(run?.outcome).toBe(JobOutcome.Done);
    expect(send.runs).toHaveLength(1);
  });

  it("loses no job when the store cannot record a retry: it runs again once its lease lapses", async () => {
    const real = new MessageProvider();
    const provider = injectFaults(real, [
      { method: "send", error: () => ProviderDownError.create() },
    ]);
    const store = injectFaults(new MemoryQueueDriver(), [{ method: "retry" }]);
    const { queue, worker, send } = setup(store.target, provider.target);
    const id = pushed(await queue.push(SendMessageAction, { to: "a@example.test" }));
    await expect(worker.drain()).rejects.toBeInstanceOf(InjectedFaultError);
    expect(await store.target.load(id)).toMatchObject({ status: JobStatus.Running, attempts: 1 });
    const [run] = await worker.drain(undefined, AFTER_LEASE);
    expect(run).toMatchObject({ outcome: JobOutcome.Done, job: { attempts: 2 } });
    expect(send.runs).toHaveLength(2);
    expect(real.sent.size).toBe(1);
  });
});
