/**
 * Stackra file contract:
 * Purpose: the database fault-injection tests of `QueueWorkerService` on real Postgres (ADR 0182 decisions 3 and 4):
 *          a row trigger (`postgresFault`) fails the write the worker records an outcome with, as the NOBYPASSRLS
 *          service role runs an owner's job. When the delete of a finished job fails, the drain fails and its
 *          transaction rolls back with the lease: the job is never dead-lettered or compensated for work that
 *          succeeded, and the next drain replays the stored result under the job's Idempotency-Key and removes it.
 *          When the update that records a retry fails, the drain fails and the job waits again: nothing is lost, and
 *          the next drain runs it once the provider answers.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped
 *           elsewhere. One fresh database for the file (`ownerPostgres`); each test arms its fault as the superuser and
 *           removes it after, and runs the worker as the service role in a session with no owner and the owner's
 *           isolation bound (`asService`, `OwnerIsolation`), as a deployed worker does. The provider is in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 3 and 4: database faults in the integration tier); ADR 0148 (decisions 1
 *                     and 3); ADR 0136 (decision 3); ADR 0239 (2026-11-07 amendment, gaps A and C).
 */
import {
  Action,
  type ActionContext,
  MemoryIdempotencyStoreDriver,
  type Resolver,
} from "@stackra/actions";
import { AccessControl, CallIsolation, IdempotencyStore } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { ActorKind, Backoff, Clock } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { ErrorKind, Refusal } from "@stackra/errors";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  injectFaults,
  it,
  postgresFault,
} from "@stackra/testing";
import type { PostgresFault } from "@stackra/testing";

import { JobOutcome } from "#core/enums/job-outcome.enum";
import { QueueService } from "#core/services/queue.service";
import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresQueueDriver } from "#node/drivers/postgres-queue.driver";
import { QueueWorkerService } from "#node/services/queue-worker.service";

/** The owner (a tenant node) every job here is queued in. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class ProviderDownError extends Refusal({ kind: ErrorKind.Unavailable }) {}

/** A provider that sends one message per Idempotency-Key. */
class MessageProvider {
  readonly sent = new Map<string, string>();

  async send(key: string, to: string): Promise<{ readonly id: string }> {
    if (!this.sent.has(key)) this.sent.set(key, to);
    return { id: `snt_${this.sent.size}` };
  }
}

/** Sends one message on its only attempt; a dead letter would compensate it. */
class SendOnceAction extends Action({
  key: "fault.send_once",
  actors: [ActorKind.System],
  job: { queue: "fault_once", retries: 0, deadLetter: true, onDeadLetter: "markFailed" },
}) {
  static provider: MessageProvider;

  readonly runs: ActionContext[] = [];

  readonly failed: unknown[] = [];

  async handle(input: { to: string }, ctx: ActionContext): Promise<{ id: string }> {
    this.runs.push(ctx);
    return SendOnceAction.provider.send(ctx.idempotencyKey ?? "none", input.to);
  }

  async markFailed(input: unknown): Promise<void> {
    this.failed.push(input);
  }
}

/** Sends one message, retried after a failure. */
class SendAction extends Action({
  key: "fault.send",
  actors: [ActorKind.System],
  job: { queue: "fault_retry", retries: 2, backoff: Backoff.Fixed, deadLetter: true },
}) {
  static provider: MessageProvider;

  readonly runs: ActionContext[] = [];

  async handle(input: { to: string }, ctx: ActionContext): Promise<{ id: string }> {
    this.runs.push(ctx);
    return SendAction.provider.send(ctx.idempotencyKey ?? "none", input.to);
  }
}

/** A resolver binding `bound`. */
const resolverOf = (bound: readonly (readonly [AnyClass, object])[]): Resolver => {
  const map = new Map<AnyClass, object>(bound);
  return {
    has: (type) => map.has(type),
    get: <T extends object>(type: AnyClass<T>) => map.get(type) as T,
  };
};

describe.skipIf(HOST === undefined)("QueueWorkerService under database faults on Postgres", () => {
  let postgres: OwnerPostgres;
  let driver: PostgresQueueDriver;
  let queue: QueueService;

  beforeAll(async () => {
    postgres = await ownerPostgres();
    driver = new PostgresQueueDriver(postgres.database);
    queue = new QueueService(driver, new SystemClock());
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser: a fault, a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Runs `work` with `fault` armed, and removes it after. */
  const withFault = async <T>(fault: PostgresFault, work: () => Promise<T>): Promise<T> => {
    for (const sql of fault.install) await superuser(sql);
    try {
      return await work();
    } finally {
      for (const sql of fault.remove) await superuser(sql);
    }
  };

  /** Each job of queue `name` as `[id, status, attempts]`. */
  const rowsOf = async (name: string) =>
    (
      await superuser("select id, status, attempts from queue.jobs where queue = ? order by id", [
        name,
      ])
    ).map((row) => [row["id"], row["status"], row["attempts"]]);

  /** A worker over the Postgres store with the owner's isolation, a memory idempotency store and `actions`. */
  const workerOf = (actions: readonly (readonly [AnyClass, object])[]) => {
    const worker = new QueueWorkerService(driver, new SystemClock());
    worker.connect(
      resolverOf([
        [AccessControl, new AllowAll()],
        [CallIsolation, new OwnerIsolation(postgres)],
        [IdempotencyStore, new MemoryIdempotencyStoreDriver(new SystemClock())],
        [Database, postgres.database],
        ...actions,
      ]),
    );
    return worker;
  };

  /** Drains queue `name` as the service role in a session with no owner. */
  const drain = (worker: QueueWorkerService, name: string) =>
    asService(postgres, undefined, () => worker.drain(name));

  it("fails the drain when the delete of a finished job fails, and replays the result on the next", async () => {
    const provider = new MessageProvider();
    SendOnceAction.provider = provider;
    const action = new SendOnceAction();
    const worker = workerOf([[SendOnceAction, action]]);
    const id = await asService(postgres, ACME, () =>
      queue.push(SendOnceAction, { to: "a@example.test" }),
    );
    const fault = postgresFault({ name: "job_remove", table: "queue.jobs", on: "delete" });
    await withFault(fault, async () => {
      await expect(drain(worker, "fault_once")).rejects.toThrow(fault.message);
      // the work succeeded: no dead letter, no compensation; the lease rolled back with the drain
      expect(action.failed).toEqual([]);
      expect(await rowsOf("fault_once")).toEqual([[id, "waiting", 0]]);
      const [run] = await drain(worker, "fault_once");
      expect(run).toMatchObject({ outcome: JobOutcome.Done, output: { id: "snt_1" } });
    });
    expect(action.runs).toHaveLength(1);
    expect(provider.sent.size).toBe(1);
    expect(await rowsOf("fault_once")).toEqual([]);
  });

  it("fails the drain when the update recording a retry fails, and runs the job on the next", async () => {
    const real = new MessageProvider();
    const provider = injectFaults(real, [
      { method: "send", error: () => ProviderDownError.create() },
    ]);
    SendAction.provider = provider.target;
    const action = new SendAction();
    const worker = workerOf([[SendAction, action]]);
    const id = await asService(postgres, ACME, () =>
      queue.push(SendAction, { to: "a@example.test" }),
    );
    // row write 1 is the reservation's lease, row write 2 the retry
    const fault = postgresFault({
      name: "job_retry",
      table: "queue.jobs",
      on: "update",
      skip: 1,
      sqlstate: "40001",
    });
    await withFault(fault, async () => {
      await expect(drain(worker, "fault_retry")).rejects.toThrow(fault.message);
      expect(await rowsOf("fault_retry")).toEqual([[id, "waiting", 0]]);
      const [run] = await drain(worker, "fault_retry");
      expect(run?.outcome).toBe(JobOutcome.Done);
    });
    expect(action.runs).toHaveLength(2);
    expect(real.sent.size).toBe(1);
    expect(await rowsOf("fault_retry")).toEqual([]);
  });
});
