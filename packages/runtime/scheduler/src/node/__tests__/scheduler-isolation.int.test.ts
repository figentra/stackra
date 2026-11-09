/**
 * Stackra file contract:
 * Purpose: the isolation test of `scheduler.schedules` on real Postgres and the tick's hot path, run as the NOBYPASSRLS
 *          service role over schedules of two owners and a platform (NULL) one. A session with no owner reads only the
 *          platform schedule directly while the tick's claim reaches every owner's; a schedule made in an owner's call
 *          takes that owner and loads only there. The tick, inside a no-owner transaction standing for the lock's,
 *          claims and advances the watermarks there, then pushes each due schedule's runs, and each per-scope cron's,
 *          in a transaction of its own (`requiresNew`) in the owner's isolation, never in the lock's transaction; a
 *          second tick of the minute pushes nothing. An owned schedule with no isolation bound fails the tick after
 *          the other owners' runs are pushed.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`); the superuser seeds and checks, everything under test
 *           runs as the service role (`asService`, `OwnerIsolation`). The jobs go to a memory queue whose push records
 *           the owner setting and the transaction it ran in, read from the same database, so the test sees where each
 *           push ran without the queue's tables. Tests share the database and run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C, decision 5); ADR 0148 (decisions 4 and 5); ADR
 *                     0495; ADR 0182 (integration tier); `.agents/rules/tenancy.md` (points 7 and 8).
 */
import { Action } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import type { AnyClass, Container } from "@stackra/container";
import { ActorKind, Clock, Logger } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { MemoryQueueDriver, QueueService, registerJobs } from "@stackra/queue";
import type { QueuedJob } from "@stackra/queue/contracts";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { SchedulerConfig } from "#config/scheduler.config";
import { MemoryCronScopesDriver } from "#core/drivers/memory-cron-scopes.driver";
import { ScheduleRowIsolationMissingError } from "#core/errors/schedule-row-isolation-missing.error";
import { registerScheduledJobs } from "#core/functions/register-scheduled-jobs.function";
import { SchedulerService } from "#core/services/scheduler.service";
import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresScheduleDriver } from "#node/drivers/postgres-schedule.driver";

/** Two owners (tenant nodes) and their scopes. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";
const ACME_SCOPE: ScopeRef = { id: ACME, path: "platform.alpha.acme" };
const GLOBEX_SCOPE: ScopeRef = { id: GLOBEX, path: "platform.alpha.globex" };
const ROOT: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2w7", path: "platform" };

/** The minute every schedule here runs in. */
const TICK = new Date("2026-11-09T12:00:30.000Z");

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-11-09T11:00:00.000Z");
  }
}

class SilentLogger extends Logger {
  debug(): void {}

  info(): void {}

  warn(): void {}

  error(): void {}
}

class SendDigestAction extends Action({
  key: "digest.send",
  actors: [ActorKind.System],
  job: { queue: "default" },
}) {
  async handle(_input: { audience?: string }): Promise<void> {}
}

class RecountAction extends Action({
  key: "stock.recount",
  actors: [ActorKind.System],
  job: { queue: "default", cron: { schedule: "0 12 * * *", perScope: true } },
}) {
  async handle(_input: object): Promise<void> {}
}

const ROWS = [
  { type: SendDigestAction, key: "digests.digest.send@1" },
  { type: RecountAction, key: "stock.stock.recount@1" },
];
registerJobs(ROWS);
registerScheduledJobs(ROWS);

/** Where one push ran: the owner setting, the transaction, and the job. */
interface Pushed {
  readonly owner: string;
  readonly tx: string;
  readonly job: QueuedJob;
}

/** A memory queue whose push records the owner setting and the transaction of the database it ran in. */
class RecordingQueueDriver extends MemoryQueueDriver {
  readonly pushed: Pushed[] = [];

  /** The database each push reads its setting and transaction from. */
  private readonly database: Database;

  constructor(database: Database) {
    super();
    this.database = database;
  }

  override async push(job: QueuedJob): Promise<boolean> {
    const [row] = (await this.database
      .em()
      .execute(
        "select coalesce(current_setting('app.tenant_id', true), '') as owner, txid_current()::text as tx",
      )) as { owner: string; tx: string }[];
    this.pushed.push({ owner: row?.owner ?? "?", tx: row?.tx ?? "?", job });
    return super.push(job);
  }
}

/** A container binding `bound`. */
const containerOf = (bound: readonly (readonly [AnyClass, object])[]): Container => {
  const map = new Map<unknown, object>(bound);
  return {
    has: (token: unknown) => map.has(token),
    get: (token: unknown) => map.get(token),
  } as unknown as Container;
};

describe.skipIf(HOST === undefined)("scheduler row security and the tick on Postgres", () => {
  let postgres: OwnerPostgres;
  let isolation: OwnerIsolation;
  let driver: PostgresScheduleDriver;

  beforeAll(async () => {
    postgres = await ownerPostgres();
    isolation = new OwnerIsolation(postgres);
    driver = new PostgresScheduleDriver(postgres.database);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds digest schedule `id` of `owner` (null: the platform's) in `scope`, made at 11:00, run at noon. */
  const seed = (id: string, owner: string | null, scope: ScopeRef) =>
    superuser(
      `insert into scheduler.schedules (id, scope_id, scope_path, job_key, cron, time_zone, input, misfire, created_at, tenant_id)
         values (?, ?, ?::ltree, 'digests.digest.send@1', '0 12 * * *', 'UTC', ?::jsonb, 'catch_up', ?, ?)`,
      [
        id,
        scope.id,
        scope.path,
        JSON.stringify({ audience: id }),
        new Date("2026-11-09T11:00:00Z"),
        owner,
      ],
    );

  /** A scheduler over the Postgres store and a recording queue, with the per-scope cron over `scopes`. */
  const schedulerOf = (
    bound: readonly (readonly [AnyClass, object])[],
    scopes: readonly ScopeRef[] = [],
  ) => {
    const clock = new FixedClock();
    const jobs = new RecordingQueueDriver(postgres.database);
    const cronScopes = new MemoryCronScopesDriver();
    cronScopes.scopes = scopes;
    const scheduler = new SchedulerService(
      new QueueService(jobs, clock),
      new Locks(new MemoryLockDriver(clock), clock),
      driver,
      cronScopes,
      clock,
      buildConfig(SchedulerConfig),
      new SilentLogger(),
      containerOf(bound),
    );
    return { scheduler, jobs };
  };

  it("shows a session with no owner only the platform schedule, while the tick's claim reaches every owner's", async () => {
    await seed("sch_acme", ACME, ACME_SCOPE);
    await seed("sch_globex", GLOBEX, GLOBEX_SCOPE);
    await seed("sch_platform", null, ROOT);
    const ids = (owner: string | undefined) =>
      asService(postgres, owner, async () =>
        (
          (await postgres.database
            .em()
            .execute("select id from scheduler.schedules order by id")) as { id: string }[]
        ).map((row) => row.id),
      );
    expect(await ids(undefined)).toEqual(["sch_platform"]);
    expect(await ids(ACME)).toEqual(["sch_acme", "sch_platform"]);
    const claims = await asService(postgres, undefined, () => driver.claim());
    expect(claims.map((claim) => [claim.id, claim.ownerId])).toEqual([
      ["sch_acme", ACME],
      ["sch_globex", GLOBEX],
      ["sch_platform", undefined],
    ]);
    await expect(
      asService(postgres, GLOBEX, () => driver.load("sch_acme")),
    ).resolves.toBeUndefined();
    await expect(asService(postgres, ACME, () => driver.load("sch_acme"))).resolves.toMatchObject({
      scope: ACME_SCOPE,
    });
  });

  it("gives a schedule made in an owner's call that owner, never one from input", async () => {
    const { scheduler } = schedulerOf([]);
    const made = await asService(postgres, GLOBEX, () =>
      scheduler.schedule(SendDigestAction, { scope: GLOBEX_SCOPE, cron: "0 9 * * *" }),
    );
    expect(
      await superuser("select tenant_id from scheduler.schedules where id = ?", [made.id]),
    ).toEqual([{ tenant_id: GLOBEX }]);
    await expect(
      asService(postgres, ACME, () => scheduler.unschedule(GLOBEX_SCOPE, made.id)),
    ).resolves.toBe(false);
    await expect(
      asService(postgres, GLOBEX, () => scheduler.unschedule(GLOBEX_SCOPE, made.id)),
    ).resolves.toBe(true);
  });

  it("refuses an owned schedule with no isolation bound after pushing the platform's runs", async () => {
    const { scheduler, jobs } = schedulerOf([[Database, postgres.database]]);
    await expect(asService(postgres, undefined, () => scheduler.tick(TICK))).rejects.toBeInstanceOf(
      ScheduleRowIsolationMissingError,
    );
    expect(jobs.pushed.map((push) => push.job.input)).toEqual([{ audience: "sch_platform" }]);
    // the test's no-owner transaction around the tick rolled back with it, so the next tick starts afresh
    expect(await superuser("select schedule_key from scheduler.watermarks")).toEqual([]);
  });

  it("claims and advances under the lock, then pushes each owner's runs in its own transaction and owner", async () => {
    const { scheduler, jobs } = schedulerOf(
      [
        [CallIsolation, isolation],
        [Database, postgres.database],
      ],
      [ACME_SCOPE, GLOBEX_SCOPE],
    );
    const lock: string[] = [];
    const advance = driver.advance.bind(driver);
    driver.advance = async (keys, at) => {
      const [row] = (await postgres.database.em().execute("select txid_current()::text as tx")) as {
        tx: string;
      }[];
      lock.push(row?.tx ?? "?");
      return advance(keys, at);
    };
    try {
      const result = await asService(postgres, undefined, () => scheduler.tick(TICK));
      expect(result).toEqual({ ran: true, pushed: 5, skipped: [] });
    } finally {
      driver.advance = advance;
    }
    const byOwner = jobs.pushed.map((push) => [push.owner, push.job.key, push.job.scope?.id]);
    expect(byOwner).toEqual(
      expect.arrayContaining([
        [ACME, "stock.stock.recount@1", ACME],
        [GLOBEX, "stock.stock.recount@1", GLOBEX],
        [ACME, "digests.digest.send@1", ACME],
        [GLOBEX, "digests.digest.send@1", GLOBEX],
        ["", "digests.digest.send@1", ROOT.id],
      ]),
    );
    expect(byOwner).toHaveLength(5);
    const transactions = new Set(jobs.pushed.map((push) => push.tx));
    expect(transactions.size).toBe(5);
    expect(lock).toHaveLength(1);
    expect(transactions.has(lock[0] ?? "")).toBe(false);
    expect(
      (await superuser("select schedule_key from scheduler.watermarks order by schedule_key")).map(
        (row) => row["schedule_key"],
      ),
    ).toEqual(["sch_acme", "sch_globex", "sch_platform", "stock.stock.recount@1"]);
    const again = await asService(postgres, undefined, () => scheduler.tick(TICK));
    expect(again.pushed).toBe(0);
  });
});
