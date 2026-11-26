/**
 * Stackra file contract:
 * Purpose: the soak of the queue on Postgres (ADR 0182 decision 4, STA-317): k6 posts to a load target whose one
 *          scenario queues a job in one of two tenants, as a deployed service's call does, while four worker loops
 *          (`QueueWorkerService.work`, the deployed shape) reserve and run them through the action pipeline in each
 *          job's tenant. After the load it waits for the backlog to drain and checks that every queued job ran exactly
 *          once, none failed or was dead-lettered and `queue.jobs` is empty, holds the drain and the queue-to-run lag
 *          to a ceiling, and keeps the numbers (`writeLoadReport("queue.soak")`) for the capacity page. A second test
 *          queues a backlog first (`STACKRA_LOAD_BACKLOG` jobs, 3000 by default) and times the same workers draining
 *          it: the ceiling one instance's workers reach (`writeLoadReport("queue.ceiling")`).
 * Boundary: load tier (`.load`): runs only where k6 is installed and `TESTBED_POSTGRES_HOST` names a Postgres, skipped
 *           elsewhere. One fresh database (`ownerPostgres`), the service's default pool of ten connections (ADR 0473)
 *           shared by the pushes and the workers, everything owned run as the NOBYPASSRLS service role
 *           (`asService`, `OwnerIsolation`). `STACKRA_LOAD_RATE` and `STACKRA_LOAD_DURATION` stretch it into a soak.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 1 and 4: the load tier, weekly k6 load tests); ADR 0148 (decisions 1 and 3);
 *                     ADR 0473 (the pool budget per service); ADR 0239 (2026-11-07 amendment); ADR 0022.
 */
import { Action } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { AccessControl, CallIsolation } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { ActorKind, Clock } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import {
  k6Binary,
  runK6,
  serveLoadTarget,
  soakLoad,
  summariseLatencies,
  writeLoadReport,
} from "@stackra/testing/node";

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

/** Two owners (tenant nodes) the jobs alternate between. */
const OWNERS = ["scp_01jab3k4m5n6p7q8r9s0t1v2w3", "scp_01jab3k4m5n6p7q8r9s0t1v2w4"] as const;

/** The queue the soak fills. */
const QUEUE = "soak";

/** Worker loops, one service instance's worth. */
const WORKERS = 4;

/** How long the backlog may take to drain once the load stops, and the lag a pass holds to. */
const CEILING = { drainMs: 60_000, lagP95Ms: 5000 } as const;

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

/** A job that records its sequence number and how long after it was queued it ran. */
class StampJobAction extends Action({
  key: "soak.stamp_job",
  actors: [ActorKind.System],
  job: { queue: QUEUE },
}) {
  readonly ran = new Map<number, number>();

  readonly lags: number[] = [];

  async handle(input: { readonly seq: number; readonly queuedAt: number }): Promise<void> {
    this.ran.set(input.seq, (this.ran.get(input.seq) ?? 0) + 1);
    this.lags.push(Date.now() - input.queuedAt);
  }
}

/** Resolves once `done` holds, polling every 100 ms, or after `ms` regardless. */
async function until(done: () => boolean, ms: number): Promise<void> {
  const deadline = Date.now() + ms;
  while (!done() && Date.now() < deadline)
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
}

describe.skipIf(HOST === undefined || k6Binary() === undefined)("the queue under a soak", () => {
  let postgres: OwnerPostgres;

  beforeAll(async () => {
    postgres = await ownerPostgres();
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** The queue, a recording job and a worker over the Postgres store, in each job's tenant. */
  const rig = () => {
    const driver = new PostgresQueueDriver(postgres.database);
    const queue = new QueueService(driver, new SystemClock());
    const stamp = new StampJobAction();
    const bound = new Map<AnyClass, object>([
      [AccessControl, new AllowAll()],
      [StampJobAction, stamp],
      [Database, postgres.database],
      [CallIsolation, new OwnerIsolation(postgres)],
    ]);
    const resolver: Resolver = {
      has: (type) => bound.has(type),
      get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
    };
    const worker = new QueueWorkerService(driver, new SystemClock());
    worker.connect(resolver);
    /** Queues job `seq` in its owner's call, as a deployed service's call does. */
    const push = (seq: number) =>
      asService(postgres, OWNERS[seq % OWNERS.length], () =>
        queue.push(StampJobAction, { seq, queuedAt: Date.now() }),
      );
    /** Starts the worker loops; the returned function stops them and resolves once they have. */
    const start = () => {
      const stop = new AbortController();
      const working = worker.work(QUEUE, { signal: stop.signal, concurrency: WORKERS });
      return async () => {
        stop.abort();
        await working;
      };
    };
    return { stamp, push, start };
  };

  /** The jobs left on the soak queue, past row security. */
  const left = async (): Promise<number> => {
    const [row] = (await postgres.database
      .em()
      .execute("select count(*)::int as n from queue.jobs where queue = ?", [QUEUE])) as {
      n: number;
    }[];
    return row?.n ?? -1;
  };

  it("runs every queued job exactly once and drains its backlog", async () => {
    const { stamp, push, start } = rig();
    const stop = start();
    let queued = 0;
    const target = await serveLoadTarget({
      push: async () => {
        const seq = queued;
        queued += 1;
        await push(seq);
      },
    });
    try {
      // 50 a second holds a ten-minute soak inside the lag ceiling on box 2; 100 a second held for 30 s but not for
      // ten minutes, as each reservation slows with the queue's length (runbooks/capacity, STA-2875).
      const load = soakLoad({ rate: 50, duration: "30s" });
      const k6 = await runK6({
        target: target.url,
        scenario: "push",
        load,
        thresholds: {
          http_req_failed: ["rate<0.001"],
          http_req_duration: ["p(95)<500"],
          dropped_iterations: ["count<1"],
        },
      });
      const pushed = target.latency("push");
      const loadEnded = Date.now();
      await until(() => stamp.ran.size >= pushed.served, CEILING.drainMs);
      const drainMs = Date.now() - loadEnded;
      await stop();
      const lag = summariseLatencies(stamp.lags, { count: 0 });
      writeLoadReport("queue.soak", {
        subject: `QueueService.push in two tenants, ${WORKERS} QueueWorkerService loops, Postgres, pool of 10`,
        load,
        k6,
        push: pushed,
        lag,
        jobs: pushed.served,
        drainMs,
        workers: WORKERS,
      });

      expect(k6.crossed).toEqual([]);
      expect(pushed.failed).toBe(0);
      expect(pushed.served).toBe(k6.requests);
      // every queued job ran exactly once, and none is left: no retry, no dead letter
      expect(stamp.ran.size).toBe(pushed.served);
      expect([...stamp.ran.values()].every((count) => count === 1)).toBe(true);
      expect(await left()).toBe(0);
      expect(drainMs).toBeLessThan(CEILING.drainMs);
      expect(lag.p95).toBeLessThan(CEILING.lagP95Ms);
    } finally {
      await stop();
      await target.close();
    }
  });

  it("drains a queued backlog at its ceiling", async () => {
    const { stamp, push, start } = rig();
    const backlog = Number(process.env["STACKRA_LOAD_BACKLOG"] ?? 3000);
    expect(Number.isInteger(backlog) && backlog > 0).toBe(true);
    // queue the backlog first, eight calls at a time, so the workers start on a full queue
    const queuedFrom = Date.now();
    let seq = 0;
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        while (seq < backlog) {
          const mine = seq;
          seq += 1;
          await push(mine);
        }
      }),
    );
    const queueMs = Date.now() - queuedFrom;
    const drainFrom = Date.now();
    const stop = start();
    // Five minutes, or longer for a backlog that needs it at twenty a second, the floor this test holds to.
    await until(() => stamp.ran.size >= backlog, Math.max(CEILING.drainMs * 5, backlog * 50));
    const drainMs = Date.now() - drainFrom;
    await stop();
    writeLoadReport("queue.ceiling", {
      subject: `a backlog of ${backlog} jobs in two tenants drained by ${WORKERS} QueueWorkerService loops, Postgres, pool of 10`,
      backlog,
      queuePerSecond: Math.round(backlog / (queueMs / 1000)),
      drainPerSecond: Math.round(backlog / (drainMs / 1000)),
      drainMs,
      workers: WORKERS,
    });

    expect(stamp.ran.size).toBe(backlog);
    expect([...stamp.ran.values()].every((count) => count === 1)).toBe(true);
    expect(await left()).toBe(0);
  });
});
