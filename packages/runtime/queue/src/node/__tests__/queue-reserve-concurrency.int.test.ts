/**
 * Stackra file contract:
 * Purpose: the concurrency test of `queue.reserve_job` on real Postgres, each worker in a transaction of its own as the
 *          NOBYPASSRLS service role, as several worker instances run it: workers draining one queue at once reserve
 *          every due job exactly once across owners; a worker skips the job another worker's open transaction holds
 *          and takes the next one at once instead of waiting for it (`FOR UPDATE … SKIP LOCKED`); a lapsed lease is
 *          taken again by exactly one of many racing workers.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped
 *           elsewhere, as the queue's other `.int` files are. One fresh database for the file (`ownerPostgres`); the
 *           superuser seeds and checks; each test uses a queue of its own.
 * Runtime: node (vitest)
 * Governing contract: ADR 0148 (decisions 1 and 3: Postgres with SKIP LOCKED); ADR 0239 (2026-11-07 amendment, gap
 *                     A); ADR 0182 (integration tier); STA-2802.
 */
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import type { JobClaim } from "#contracts/index";
import { asService, HOST, ownerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresQueueDriver } from "#node/drivers/postgres-queue.driver";

/** Two owners (tenant nodes) and the platform (null). */
const OWNERS = ["scp_01jab3k4m5n6p7q8r9s0t1v2w3", "scp_01jab3k4m5n6p7q8r9s0t1v2w4", null] as const;

/** How many workers race. */
const WORKERS = 6;

/** A promise and the function that settles it. */
function gate(): { readonly opened: Promise<void>; readonly open: () => void } {
  const settle: { resolve?: () => void } = {};
  const opened = new Promise<void>((resolve) => {
    settle.resolve = resolve;
  });
  return { opened, open: () => settle.resolve?.() };
}

/** `"late"` when `promise` has not settled within `milliseconds`, else its value. */
function within<T>(promise: Promise<T>, milliseconds: number): Promise<T | "late"> {
  return Promise.race([
    promise,
    new Promise<"late">((resolve) => {
      setTimeout(() => resolve("late"), milliseconds);
    }),
  ]);
}

describe.skipIf(HOST === undefined)("queue.reserve_job under concurrent workers", () => {
  let postgres: OwnerPostgres;
  let driver: PostgresQueueDriver;

  beforeAll(async () => {
    postgres = await ownerPostgres();
    driver = new PostgresQueueDriver(postgres.database);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database
      .em()
      .fork()
      .execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds `count` due jobs on queue `name`, spread over the owners; their ids. */
  const seed = async (name: string, count: number): Promise<readonly string[]> => {
    const ids = Array.from(
      { length: count },
      (_, index) => `job_${name}_${String(index).padStart(3, "0")}`,
    );
    for (const [index, id] of ids.entries())
      // oxlint-disable-next-line no-await-in-loop -- seeds in order, so run_at follows the index
      await superuser(
        `insert into queue.jobs (id, queue, job_key, input, status, attempts, run_at, lease, tenant_id)
           values (?, ?, 'touch.run', '{}'::jsonb, 'waiting', 0, now() - interval '1 minute', 'PT1M', ?)`,
        [id, name, OWNERS[index % OWNERS.length]],
      );
    return ids;
  };

  /** One reservation in a transaction of its own as the service role, as one worker's tick runs it. */
  const reserveOnce = (name: string): Promise<JobClaim | undefined> =>
    asService(postgres, undefined, () => driver.reserve(name, new Date()));

  it("reserves every due job exactly once while workers drain one queue at once", async () => {
    const ids = await seed("race", 36);
    const claimed: string[] = [];
    const worker = async (): Promise<void> => {
      for (;;) {
        // oxlint-disable-next-line no-await-in-loop -- a worker reserves one job after another until none is due
        const claim = await reserveOnce("race");
        if (claim === undefined) return;
        claimed.push(claim.id);
      }
    };
    await Promise.all(Array.from({ length: WORKERS }, worker));
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts the array filled above; toSorted is ES2023
    expect(claimed.sort()).toEqual([...ids]);
    const rows = await superuser(
      "select status, attempts, count(*)::int as jobs from queue.jobs where queue = 'race' group by status, attempts",
    );
    expect(rows).toEqual([{ status: "running", attempts: 1, jobs: 36 }]);
  });

  it("skips the job another worker's open transaction holds and takes the next one at once", async () => {
    await seed("skip", 2);
    const taken = gate();
    const release = gate();
    let first: JobClaim | undefined;
    const holder = asService(postgres, undefined, async () => {
      first = await driver.reserve("skip", new Date());
      taken.open();
      await release.opened;
    });
    await taken.opened;
    const second = await within(reserveOnce("skip"), 5000);
    release.open();
    await holder;
    expect(first?.id).toBe("job_skip_000");
    expect(second).not.toBe("late");
    expect((second as JobClaim | undefined)?.id).toBe("job_skip_001");
    await expect(reserveOnce("skip")).resolves.toBeUndefined();
  });

  it("gives a lapsed lease to exactly one of many racing workers", async () => {
    await superuser(
      `insert into queue.jobs (id, queue, job_key, input, status, attempts, run_at, lease, locked_until, tenant_id)
         values ('job_lapsed_000', 'lapsed', 'touch.run', '{}'::jsonb, 'running', 1, now() - interval '10 minutes',
                 'PT1M', now() - interval '1 minute', ?)`,
      [OWNERS[0]],
    );
    const claims = await Promise.all(Array.from({ length: WORKERS }, () => reserveOnce("lapsed")));
    expect(claims.filter((claim) => claim !== undefined).map((claim) => claim?.id)).toEqual([
      "job_lapsed_000",
    ]);
    expect(
      await superuser("select status, attempts from queue.jobs where id = 'job_lapsed_000'"),
    ).toEqual([{ status: "running", attempts: 2 }]);
  });
});
