/**
 * Stackra file contract:
 * Purpose: the isolation test of `scheduler.schedules` on real Postgres and the tick's hot path, run as the NOBYPASSRLS
 *          service role over schedules of two owners and a platform (NULL) one. A session with no owner reads only the
 *          platform schedule directly while the tick's claim reaches every owner's; a schedule made in an owner's call
 *          takes that owner and loads only there. The tick, inside a no-owner transaction standing for the lock's,
 *          claims and advances the watermarks there, then pushes each due schedule's runs, and each per-scope cron's,
 *          in a transaction of its own (`requiresNew`) in the owner's isolation, never in the lock's transaction; a
 *          second tick of the minute pushes nothing. An owned schedule with no isolation bound fails the tick after
 *          the other owners' runs are pushed. Dispatch is at least once with no duplicate: a tick that dies after its
 *          pushes and before its watermark moves is followed by one that pushes nothing again, also when the first
 *          jobs already finished (the fire records in `scheduler.fires` outlast them), and a push that fails rolls its
 *          fire back with it and keeps its key's watermark, so the next tick pushes it exactly once. `fire`, the Encore
 *          CronJob entry, pushes a cron's slot once per scope in its owner: a retry in the slot and a tick of it push
 *          nothing again, the next slot pushes again.
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
import type { Database } from "@stackra/database";
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

/** The same minute on the next days, for the crash cases. */
const DAY_2 = new Date("2026-11-10T12:00:30.000Z");
const DAY_3 = new Date("2026-11-11T12:00:30.000Z");
const DAY_4 = new Date("2026-11-12T12:00:30.000Z");
const DAY_5 = new Date("2026-11-13T12:00:30.000Z");

/** Twenty seconds after `at`: the next tick of the same minute. */
const later = (at: Date): Date => new Date(at.getTime() + 20_000);

/** A clock the test sets: 11:00 on the first day unless moved. */
class FixedClock extends Clock {
  at = new Date("2026-11-09T11:00:00.000Z");

  now(): Date {
    return new Date(this.at);
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

  /** An owner whose pushes fail, as a queue that refuses them would. */
  failFor: string | undefined;

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
    if (row?.owner === this.failFor) throw new Error(`the queue refused ${row?.owner}`);
    this.pushed.push({ owner: row?.owner ?? "?", tx: row?.tx ?? "?", job });
    return super.push(job);
  }
}

/** The key and scope of every job pushed, sorted. */
const runsOf = (jobs: RecordingQueueDriver) =>
  jobs.pushed.map((push) => `${push.job.key} ${push.job.scope?.id ?? "-"}`).sort();

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
    return { scheduler, jobs, clock };
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
    const { scheduler, jobs } = schedulerOf([]);
    await expect(asService(postgres, undefined, () => scheduler.tick(TICK))).rejects.toBeInstanceOf(
      ScheduleRowIsolationMissingError,
    );
    expect(jobs.pushed.map((push) => push.job.input)).toEqual([{ audience: "sch_platform" }]);
    // the test's no-owner transaction around the tick rolled back with it (no watermark moved); the platform
    // push's fire record committed in its own transaction, so the next tick does not push that run again
    expect(await superuser("select schedule_key from scheduler.watermarks")).toEqual([]);
  });

  it("claims and advances under the lock, then pushes each owner's runs in its own transaction and owner", async () => {
    const { scheduler, jobs } = schedulerOf(
      [[CallIsolation, isolation]],
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
      // the refused tick above already pushed the platform schedule's noon run and recorded its fire: not again
      expect(result).toEqual({ ran: true, pushed: 4, skipped: [] });
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
      ]),
    );
    expect(byOwner).toHaveLength(4);
    const transactions = new Set(jobs.pushed.map((push) => push.tx));
    expect(transactions.size).toBe(4);
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

  /** The fire keys recorded at noon of `at`'s day, with their owners. */
  const firesOn = async (at: Date) =>
    (
      await superuser(
        "select fire_key, tenant_id from scheduler.fires where fire_at = ? order by fire_key",
        [new Date(at.getTime() - 30_000)],
      )
    ).map((row) => [row["fire_key"], row["tenant_id"]]);

  /** A scheduler whose next advance fails, as a tick that dies after its pushes. */
  const crashing = () => {
    const made = schedulerOf([[CallIsolation, isolation]], [ACME_SCOPE, GLOBEX_SCOPE]);
    const advance = driver.advance.bind(driver);
    driver.advance = async () => {
      driver.advance = advance;
      throw new Error("crash after the pushes");
    };
    return made;
  };

  /** Every run of one day: two recount runs, three digest runs, each in its owner. */
  const EVERY_RUN = [
    `digests.digest.send@1 ${ACME}`,
    `digests.digest.send@1 ${GLOBEX}`,
    `digests.digest.send@1 ${ROOT.id}`,
    `stock.stock.recount@1 ${ACME}`,
    `stock.stock.recount@1 ${GLOBEX}`,
  ].sort();

  it("pushes each run exactly once when a tick dies after its pushes and before its watermark moves", async () => {
    const { scheduler, jobs } = crashing();
    await expect(asService(postgres, undefined, () => scheduler.tick(DAY_2))).rejects.toThrow(
      "crash after the pushes",
    );
    expect(runsOf(jobs)).toEqual(EVERY_RUN);
    // each fire was recorded in its owner, committed with its push
    expect(await firesOn(DAY_2)).toEqual([
      ["sch_acme", ACME],
      ["sch_globex", GLOBEX],
      ["sch_platform", null],
      [`stock.stock.recount@1:${ACME}`, ACME],
      [`stock.stock.recount@1:${GLOBEX}`, GLOBEX],
    ]);
    const marks = await superuser("select max(ticked_at) as at from scheduler.watermarks");
    expect(new Date(String(marks[0]?.["at"]))).toEqual(TICK);
    const again = await asService(postgres, undefined, () => scheduler.tick(later(DAY_2)));
    expect(again).toEqual({ ran: true, pushed: 0, skipped: [] });
    expect(runsOf(jobs)).toEqual(EVERY_RUN);
  });

  it("pushes each run exactly once when its first job finished before the next tick", async () => {
    const { scheduler, jobs } = crashing();
    await expect(asService(postgres, undefined, () => scheduler.tick(DAY_3))).rejects.toThrow(
      "crash after the pushes",
    );
    // the worker ran every job and removed it: no live job holds any key any more
    for (const push of jobs.pushed) await jobs.remove(push.job.id);
    expect(await jobs.load(jobs.pushed[0]?.job.id ?? "job_x")).toBeUndefined();
    const again = await asService(postgres, undefined, () => scheduler.tick(later(DAY_3)));
    expect(again.pushed).toBe(0);
    expect(runsOf(jobs)).toEqual(EVERY_RUN);
  });

  it("rolls a failed push's fire back with it, keeps that key's watermark, and pushes it once on the next tick", async () => {
    const { scheduler, jobs } = schedulerOf(
      [[CallIsolation, isolation]],
      [ACME_SCOPE, GLOBEX_SCOPE],
    );
    jobs.failFor = GLOBEX;
    // caught inside the no-owner transaction, so the advance it made commits as the lock's would
    const refused = await asService(postgres, undefined, () =>
      scheduler.tick(DAY_4).catch((error: unknown) => error),
    );
    expect(String(refused)).toContain(`the queue refused ${GLOBEX}`);
    expect((await firesOn(DAY_4)).map((row) => row[0])).toEqual([
      "sch_acme",
      "sch_platform",
      `stock.stock.recount@1:${ACME}`,
    ]);
    const marks = new Map(
      (await superuser("select schedule_key, ticked_at from scheduler.watermarks")).map((row) => [
        row["schedule_key"],
        new Date(String(row["ticked_at"])),
      ]),
    );
    expect(marks.get("sch_acme")).toEqual(DAY_4);
    expect(marks.get("sch_globex")).toEqual(later(DAY_3));
    expect(marks.get("stock.stock.recount@1")).toEqual(later(DAY_3));
    jobs.failFor = undefined;
    const again = await asService(postgres, undefined, () => scheduler.tick(later(DAY_4)));
    expect(again.pushed).toBe(2);
    expect(runsOf(jobs)).toEqual(EVERY_RUN);
  });

  it("fires a cron's slot once per scope when Encore retries it, the next slot again, and shares a slot with a tick", async () => {
    const { scheduler, jobs, clock } = schedulerOf(
      [[CallIsolation, isolation]],
      [ACME_SCOPE, GLOBEX_SCOPE],
    );
    const recounts = () => jobs.pushed.filter((push) => push.job.key === "stock.stock.recount@1");
    // Encore calls at 12:00:30 on day 5, then retries at 12:40: both in the daily cron's 12:00 slot
    clock.at = DAY_5;
    await expect(
      asService(postgres, undefined, () => scheduler.fire("stock.stock.recount@1")),
    ).resolves.toBe(2);
    clock.at = new Date(DAY_5.getTime() + 40 * 60_000);
    await expect(
      asService(postgres, undefined, () => scheduler.fire("stock.stock.recount@1")),
    ).resolves.toBe(0);
    expect(
      recounts()
        .map((push) => [push.owner, push.job.scope?.id])
        .sort(),
    ).toEqual([
      [ACME, ACME],
      [GLOBEX, GLOBEX],
    ]);
    expect(await firesOn(DAY_5)).toEqual(
      expect.arrayContaining([
        [`stock.stock.recount@1:${ACME}`, ACME],
        [`stock.stock.recount@1:${GLOBEX}`, GLOBEX],
      ]),
    );
    // a tick of the same slot shares the fire key and time: the recount is not pushed again
    await asService(postgres, undefined, () => scheduler.tick(later(DAY_5)));
    expect(recounts()).toHaveLength(2);
    // the next day's slot is a new fire
    clock.at = new Date(DAY_5.getTime() + 86_400_000);
    await expect(
      asService(postgres, undefined, () => scheduler.fire("stock.stock.recount@1")),
    ).resolves.toBe(2);
    expect(recounts()).toHaveLength(4);
  });
});
