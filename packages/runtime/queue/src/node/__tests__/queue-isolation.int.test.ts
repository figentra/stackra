/**
 * Stackra file contract:
 * Purpose: the isolation test of `queue.jobs` on real Postgres, each hot path run as the NOBYPASSRLS service role over
 *          jobs of two owners and a platform (NULL) job. A session with no owner reads only the platform job directly
 *          while the reservation's system function leases every owner's (the lease columns only); a job queued in an
 *          owner's call takes that owner. The worker loads each reserved job in its owner and lands every outcome
 *          there: complete (removed), retry, dead letter and a throttle's release; it queues a chain's next link from
 *          its no-owner session in a transaction of its own for the job's owner; an owned job with no isolation bound,
 *          or a claim that does not load, fails the drain and is never skipped. The operator's commands claim dead
 *          letters across owners and load or redrive each in its owner, and a redrive is refused while a live job of
 *          another owner holds the same unique key.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`); the superuser seeds and checks, everything under test
 *           runs as the service role (`asService`, `OwnerIsolation`). Tests share the database and run in order, each
 *           on its own queue.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C, decision 6); ADR 0148 (decisions 1 and 3); ADR
 *                     0495; ADR 0182 (integration tier); `.agents/rules/tenancy.md` (points 7 and 8).
 */
import { Action, MemoryRateLimitStoreDriver } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { AccessControl, CallIsolation, RateLimitStore } from "@stackra/actions/contracts";
import { runCommandForTest } from "@stackra/console/testing";
import { type AnyClass, type Container, Driver } from "@stackra/container";
import { ActorKind, Backoff, Clock } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { ErrorKind, Refusal } from "@stackra/errors";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { QueueDriver } from "#contracts/index";
import { JobOutcome } from "#core/enums/job-outcome.enum";
import { JobClaimNotLoadedError } from "#core/errors/job-claim-not-loaded.error";
import { JobRowIsolationMissingError } from "#core/errors/job-row-isolation-missing.error";
import { inRowOwner } from "#core/functions/in-row-owner.function";
import { QueueService } from "#core/services/queue.service";
import type { JobFairnessOptions } from "#core/types/job-fairness-options.type";
import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { QueueFailedCommand } from "#node/commands/queue-failed.command";
import { QueueRetryCommand } from "#node/commands/queue-retry.command";
import { PostgresQueueDriver } from "#node/drivers/postgres-queue.driver";
import { QueueWorkerService } from "#node/services/queue-worker.service";

/** Two owners (tenant nodes). */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

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

class GoneError extends Refusal({ kind: ErrorKind.NotFound }) {}

/** A job whose input says how it ends: `ok`, `down` (retried) or `gone` (dead-lettered). */
class TouchAction extends Action({
  key: "touch.run",
  actors: [ActorKind.System],
  job: { queue: "it", retries: 1, backoff: Backoff.Fixed, deadLetter: true },
}) {
  async handle(input: { mode: "ok" | "down" | "gone" }): Promise<{ done: true }> {
    if (input.mode === "down") throw ProviderDownError.create();
    if (input.mode === "gone") throw GoneError.create();
    return { done: true };
  }
}

/** A chain's second link, on a queue no drain of `it` reserves, so its row is read before it runs. */
class LaterAction extends Action({
  key: "later.run",
  actors: [ActorKind.System],
  job: { queue: "later" },
}) {
  async handle(): Promise<void> {}
}

// Typed apart until @stackra/actions' `JobOptions` lists the fairness fields, as the worker's unit test does.
const THROTTLED_JOB: JobFairnessOptions & { readonly queue: string } = {
  queue: "throttled",
  throttle: { perMinute: 1, key: "it" },
};

/** One attempt a minute on one bucket: a second job is released. */
class ThrottledAction extends Action({
  key: "throttled.run",
  actors: [ActorKind.System],
  job: THROTTLED_JOB,
}) {
  async handle(): Promise<void> {}
}

/** A resolver binding `bound`. */
const resolverOf = (bound: readonly (readonly [AnyClass, object])[]): Resolver => {
  const map = new Map<AnyClass, object>(bound);
  return {
    has: (type) => map.has(type),
    get: <T extends object>(type: AnyClass<T>) => map.get(type) as T,
  };
};

describe.skipIf(HOST === undefined)("queue row security on Postgres", () => {
  let postgres: OwnerPostgres;
  let isolation: OwnerIsolation;
  let driver: PostgresQueueDriver;
  let queue: QueueService;

  beforeAll(async () => {
    postgres = await ownerPostgres();
    isolation = new OwnerIsolation(postgres);
    driver = new PostgresQueueDriver(postgres.database);
    queue = new QueueService(driver, new SystemClock());
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Each job of `queue` as `[id, tenant_id, status, attempts]`, by id. */
  const rowsOf = async (name: string) =>
    (
      await superuser(
        "select id, tenant_id, status, attempts from queue.jobs where queue = ? order by id",
        [name],
      )
    ).map((row) => [row["id"], row["tenant_id"], row["status"], row["attempts"]]);

  /** Seeds job `id` of `owner` (null: the platform's) on queue `name`. */
  const seed = (
    id: string,
    owner: string | null,
    name: string,
    fields: { readonly status?: string; readonly uniqueKey?: string } = {},
  ) =>
    superuser(
      `insert into queue.jobs (id, queue, job_key, input, status, attempts, run_at, lease, unique_key, tenant_id)
         values (?, ?, 'touch.run', '{"mode":"ok"}'::jsonb, ?, 0, now() - interval '1 second', 'PT1M', ?, ?)`,
      [id, name, fields.status ?? "waiting", fields.uniqueKey ?? null, owner],
    );

  /** A worker over the Postgres store, connected to the actions, the allow-all access control and `extra`. */
  const workerOf = (extra: readonly (readonly [AnyClass, object])[] = []) => {
    const worker = new QueueWorkerService(driver, new SystemClock());
    worker.connect(
      resolverOf([
        [AccessControl, new AllowAll()],
        [TouchAction, new TouchAction()],
        [LaterAction, new LaterAction()],
        [ThrottledAction, new ThrottledAction()],
        [RateLimitStore, new MemoryRateLimitStoreDriver()],
        [Database, postgres.database],
        ...extra,
      ]),
    );
    return worker;
  };

  /** Pushes `mode` jobs of TouchAction in `owner`'s call (undefined: the platform's); their ids. */
  const pushIn = (owner: string | undefined, mode: "ok" | "down" | "gone") =>
    asService(postgres, owner, () => queue.push(TouchAction, { mode }));

  it("shows a session with no owner only the platform job, while the reservation leases every owner's", async () => {
    await seed("job_reserve_acme", ACME, "reserve");
    await seed("job_reserve_globex", GLOBEX, "reserve");
    await seed("job_reserve_platform", null, "reserve");
    const ids = (owner: string | undefined) =>
      asService(postgres, owner, async () =>
        (
          (await postgres.database
            .em()
            .execute("select id from queue.jobs where queue = 'reserve' order by id")) as {
            id: string;
          }[]
        ).map((row) => row.id),
      );
    expect(await ids(undefined)).toEqual(["job_reserve_platform"]);
    expect(await ids(ACME)).toEqual(["job_reserve_acme", "job_reserve_platform"]);
    const now = new Date();
    const claims = await asService(postgres, undefined, async () => [
      await driver.reserve("reserve", now),
      await driver.reserve("reserve", now),
      await driver.reserve("reserve", now),
      await driver.reserve("reserve", now),
    ]);
    expect(
      claims
        .slice(0, 3)
        .map((claim) => [claim?.id, claim?.ownerId])
        .sort(),
    ).toEqual([
      ["job_reserve_acme", ACME],
      ["job_reserve_globex", GLOBEX],
      ["job_reserve_platform", undefined],
    ]);
    expect(claims[3]).toBeUndefined();
    // the lease wrote the lease columns, and the owner stayed
    expect(await rowsOf("reserve")).toEqual([
      ["job_reserve_acme", ACME, "running", 1],
      ["job_reserve_globex", GLOBEX, "running", 1],
      ["job_reserve_platform", null, "running", 1],
    ]);
    await expect(
      asService(postgres, GLOBEX, () => driver.load("job_reserve_acme")),
    ).resolves.toBeUndefined();
    await expect(
      asService(postgres, ACME, () => driver.load("job_reserve_acme")),
    ).resolves.toMatchObject({ id: "job_reserve_acme" });
  });

  it("gives a job queued in an owner's call that owner, never one from input", async () => {
    const acme = await pushIn(ACME, "ok");
    const platform = await pushIn(undefined, "ok");
    const rows = await superuser("select id, tenant_id from queue.jobs where queue = 'it'");
    expect(new Map(rows.map((row) => [row["id"], row["tenant_id"]]))).toEqual(
      new Map([
        [acme, ACME],
        [platform, null],
      ]),
    );
    await superuser("delete from queue.jobs where queue = 'it'");
  });

  it("refuses an owned job when no isolation is bound, and keeps it", async () => {
    await pushIn(ACME, "ok");
    await expect(
      asService(postgres, undefined, () => workerOf().drain("it")),
    ).rejects.toBeInstanceOf(JobRowIsolationMissingError);
    expect((await rowsOf("it")).map((row) => row[1])).toEqual([ACME]);
    await superuser("delete from queue.jobs where queue = 'it'");
  });

  it("completes each owner's job in its owner and removes it", async () => {
    await pushIn(ACME, "ok");
    await pushIn(GLOBEX, "ok");
    await pushIn(undefined, "ok");
    const runs = await asService(postgres, undefined, () =>
      workerOf([[CallIsolation, isolation]]).drain("it"),
    );
    expect(runs.map((run) => run.outcome)).toEqual([
      JobOutcome.Done,
      JobOutcome.Done,
      JobOutcome.Done,
    ]);
    expect(await rowsOf("it")).toEqual([]);
  });

  it("records a retry and then the dead letter in the job's owner", async () => {
    const id = await pushIn(GLOBEX, "down");
    const worker = workerOf([[CallIsolation, isolation]]);
    const [first] = await asService(postgres, undefined, () => worker.drain("it"));
    expect(first?.outcome).toBe(JobOutcome.Retried);
    expect(await rowsOf("it")).toEqual([[id, GLOBEX, "waiting", 1]]);
    const [last] = await asService(postgres, undefined, () => worker.drain("it", first?.retryAt));
    expect(last?.outcome).toBe(JobOutcome.DeadLettered);
    expect(await rowsOf("it")).toEqual([[id, GLOBEX, "dead", 2]]);
    expect(
      await superuser("select last_error->>'code' as code from queue.jobs where id = ?", [id]),
    ).toEqual([{ code: "provider_down" }]);
  });

  it("dead-letters a refusal at once in the job's owner", async () => {
    const id = await pushIn(ACME, "gone");
    const [run] = await asService(postgres, undefined, () =>
      workerOf([[CallIsolation, isolation]]).drain("it"),
    );
    expect(run?.outcome).toBe(JobOutcome.DeadLettered);
    expect((await rowsOf("it")).find((row) => row[0] === id)).toEqual([id, ACME, "dead", 1]);
  });

  it("releases a throttled job in its owner with its attempt given back", async () => {
    await asService(postgres, ACME, () => queue.push(ThrottledAction, {}));
    const second = await asService(postgres, ACME, () => queue.push(ThrottledAction, {}));
    const runs = await asService(postgres, undefined, () =>
      workerOf([[CallIsolation, isolation]]).drain("throttled"),
    );
    expect(runs.map((run) => run.outcome)).toEqual([JobOutcome.Done, JobOutcome.Throttled]);
    expect(await rowsOf("throttled")).toEqual([[second, ACME, "waiting", 0]]);
  });

  it("queues a chain's next link from a no-owner session in the job's owner, in a transaction of its own", async () => {
    await asService(postgres, GLOBEX, () =>
      queue.chain([
        { type: TouchAction, input: { mode: "ok" } },
        { type: LaterAction, input: {} },
      ]),
    );
    const [run] = await asService(postgres, undefined, () =>
      workerOf([[CallIsolation, isolation]]).drain("it"),
    );
    expect(run?.outcome).toBe(JobOutcome.Done);
    expect((await rowsOf("it")).map((row) => row[0])).not.toContain(run?.job.id);
    expect((await rowsOf("later")).map((row) => [row[1], row[2]])).toEqual([[GLOBEX, "waiting"]]);
  });

  it("fails a reserved job that does not load in the owner it was claimed for, and keeps it", async () => {
    const id = await pushIn(ACME, "ok");
    const wrong = {
      run: <T>(_actor: unknown, scope: unknown, work: () => Promise<T>) =>
        isolation.run(
          { kind: ActorKind.System, id: "sys_wrong", scopeId: GLOBEX },
          scope as never,
          work,
        ),
    } as unknown as CallIsolation;
    await expect(
      asService(postgres, undefined, () => workerOf([[CallIsolation, wrong]]).drain("it")),
    ).rejects.toBeInstanceOf(JobClaimNotLoadedError);
    // the drain's transaction rolled back with its lease: the job waits again, never skipped
    expect((await rowsOf("it")).filter((row) => row[0] === id)).toEqual([[id, ACME, "waiting", 0]]);
    await superuser("delete from queue.jobs where id = ?", [id]);
  });

  it("lets the operator list and redrive every owner's dead letters by claim-then-load", async () => {
    await seed("job_ops_acme", ACME, "ops", { status: "dead" });
    await seed("job_ops_globex", GLOBEX, "ops", { status: "dead" });
    await seed("job_ops_platform", null, "ops", { status: "dead" });
    const owners: unknown[] = [];
    const recording = {
      run: <T>(actor: { scopeId?: string }, scope: unknown, work: () => Promise<T>) => {
        owners.push(actor.scopeId);
        return isolation.run(actor as never, scope as never, work);
      },
    } as unknown as CallIsolation;
    const bound = {
      has: (token: unknown) => token === CallIsolation,
      get: () => recording,
    } as unknown as Container;
    const container = () => ({
      get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
        Reflect.construct(
          type,
          type === (QueueRetryCommand as unknown)
            ? [driver, new SystemClock(), bound]
            : [driver, bound],
        ) as T,
      close: async () => {},
    });
    const listed = await asService(postgres, undefined, () =>
      runCommandForTest([QueueFailedCommand], ["queue:failed", "--queue", "ops"], { container }),
    );
    expect(listed.exitCode).toBe(0);
    for (const id of ["job_ops_acme", "job_ops_globex", "job_ops_platform"])
      expect(listed.stdout).toContain(id);
    const retried = await asService(postgres, undefined, () =>
      runCommandForTest([QueueRetryCommand], ["queue:retry", "job_ops_globex"], { container }),
    );
    expect(retried.exitCode).toBe(0);
    expect(owners).toEqual([ACME, GLOBEX, undefined, GLOBEX]);
    expect(await rowsOf("ops")).toEqual([
      ["job_ops_acme", ACME, "dead", 0],
      ["job_ops_globex", GLOBEX, "waiting", 0],
      ["job_ops_platform", null, "dead", 0],
    ]);
  });

  it("refuses a redrive while a live job of another owner holds the same unique key", async () => {
    await seed("job_unique_acme", ACME, "unique", { status: "dead", uniqueKey: "u:1" });
    await seed("job_unique_globex", GLOBEX, "unique", { uniqueKey: "u:1" });
    const redrive = () =>
      asService(postgres, undefined, () =>
        inRowOwner(isolation, ACME, "job_unique_acme", () =>
          driver.redrive("job_unique_acme", new Date()),
        ),
      );
    await expect(redrive()).resolves.toBe(false);
    await superuser("delete from queue.jobs where id = 'job_unique_globex'");
    await expect(redrive()).resolves.toBe(true);
    expect(await rowsOf("unique")).toEqual([["job_unique_acme", ACME, "waiting", 0]]);
  });

  it("is a QueueDriver", () => {
    expect(driver).toBeInstanceOf(QueueDriver);
  });
});
