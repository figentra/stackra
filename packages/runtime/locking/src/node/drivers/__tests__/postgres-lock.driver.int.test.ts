/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresLockDriver` on real Postgres, with transactions on separate connections as
 *          two instances of a service have: a key taken in one transaction is refused to every other until that
 *          transaction ends, commit or rollback; a refused multi-key try keeps the keys it took before the busy one
 *          until its own transaction ends; each lease writes its keys' `locking.lock_tokens` rows and draws a token
 *          larger than every earlier lease's, a rolled-back one included; `within` joins a running transaction and
 *          opens one only when none runs; and `Locks` over two drivers serialises a read-modify-write and lets one
 *          `tryWith` run.
 * Boundary: integration tier (`.int`): needs Docker for the Testcontainers Postgres (`usePostgres`); the compiled 0001
 *           migration creates `locking.lock_tokens`. Each test uses keys of its own.
 * Runtime: node (vitest)
 * Governing contract: ADR 0149 (decisions 1 to 3); ADR 0103 (decisions 1 and 2); ADR 0394 (decision 3); ADR 0182
 *                     (integration tier); STA-2802.
 */
import { SystemClockDriver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { describe, expect, it } from "@stackra/testing";

import type { LockLease } from "#contracts/index";
import { Locks } from "#core/services/locks.service";
import { CreateLockTokensMigration } from "#node/database/migrations/0001-create-lock-tokens.migration";
import { PostgresLockDriver } from "#node/drivers/postgres-lock.driver";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateLockTokensMigration, { schema: "locking", createsSchema: true }),
  ],
});

const TTL = Duration.seconds(5);

/** The entity manager of the running context: the transaction's inside one. */
const em = () => postgres.database.em();

/** A driver over the test database. */
const driver = (): PostgresLockDriver => new PostgresLockDriver(postgres.database);

/** A promise and the function that settles it. */
function gate(): { readonly opened: Promise<void>; readonly open: () => void } {
  const settle: { resolve?: () => void } = {};
  const opened = new Promise<void>((resolve) => {
    settle.resolve = resolve;
  });
  return { opened, open: () => settle.resolve?.() };
}

/** Resolves after `milliseconds`. */
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

/** Tries `keys` in a transaction of its own, which ends at once. */
const tryAlone = (keys: readonly string[], owner = "other"): Promise<LockLease | undefined> =>
  postgres.database.transaction(() => driver().tryAcquire(keys, owner, TTL));

/**
 * Takes `keys` in a transaction that stays open until `release` opens, and answers the lease once taken. `fail` rolls
 * the transaction back instead of committing it.
 */
async function holdUntil(
  keys: readonly string[],
  release: Promise<void>,
  options: { readonly fail?: boolean } = {},
): Promise<{ readonly lease: LockLease | undefined; readonly ended: Promise<void> }> {
  const acquired = gate();
  let lease: LockLease | undefined;
  const ended = postgres.database
    .transaction(async () => {
      lease = await driver().tryAcquire(keys, "holder", TTL);
      acquired.open();
      await release;
      if (options.fail === true) throw new Error("rolled back on purpose");
    })
    .catch((error: unknown) => {
      if (options.fail !== true) throw error;
    });
  await acquired.opened;
  return { lease, ended };
}

/** `value`, which the test expects present. */
function taken<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("expected a value");
  return value;
}

describe(PostgresLockDriver, () => {
  it("refuses a held key to every other transaction until the holder commits", async () => {
    const release = gate();
    const holder = await holdUntil(["a1"], release.opened);
    expect(holder.lease).toMatchObject({ keys: ["a1"], owner: "holder" });
    expect(await tryAlone(["a1"])).toBeUndefined();
    expect(await tryAlone(["a2"])).toBeDefined();
    release.open();
    await holder.ended;
    const next = await tryAlone(["a1"]);
    expect(taken(next).token).toBeGreaterThan(taken(holder.lease).token);
  });

  it("frees the key when the holder rolls back, and never gives its token again", async () => {
    const release = gate();
    const holder = await holdUntil(["b1"], release.opened, { fail: true });
    expect(await tryAlone(["b1"])).toBeUndefined();
    release.open();
    await holder.ended;
    const next = await tryAlone(["b1"]);
    expect(taken(next).token).toBeGreaterThan(taken(holder.lease).token);
  });

  it("keeps the keys a refused try took before the busy one until its own transaction ends", async () => {
    const releaseHolder = gate();
    const holder = await holdUntil(["c2"], releaseHolder.opened);
    const releaseTry = gate();
    const refused = gate();
    const trying = postgres.database.transaction(async () => {
      const lease = await driver().tryAcquire(["c1", "c2"], "trier", TTL);
      refused.open();
      await releaseTry.opened;
      return lease;
    });
    await refused.opened;
    expect(await tryAlone(["c1"])).toBeUndefined();
    releaseTry.open();
    await expect(trying).resolves.toBeUndefined();
    expect(await tryAlone(["c1"])).toBeDefined();
    releaseHolder.open();
    await holder.ended;
  });

  it("writes each key's token row and draws a larger token with every lease", async () => {
    const tokens: number[] = [];
    for (let index = 0; index < 5; index += 1) {
      // oxlint-disable-next-line no-await-in-loop -- each lease follows the one before it
      const lease = await tryAlone(["d1", "d2"]);
      tokens.push(taken(lease).token);
    }
    expect(tokens).toEqual([...tokens].sort((left, right) => left - right));
    expect(new Set(tokens).size).toBe(tokens.length);
    const rows = (await postgres.database
      .em()
      .fork()
      .execute(
        "select lock_key from locking.lock_tokens where lock_key in ('d1', 'd2') order by lock_key",
      )) as unknown as readonly { readonly lock_key: string }[];
    expect(rows.map((row) => row.lock_key)).toEqual(["d1", "d2"]);
  });

  it("joins a running transaction and opens one only when none runs", async () => {
    const backend = async (): Promise<string> => {
      const [row] = (await postgres.database
        .em()
        .execute("select txid_current()::text as id")) as unknown as readonly {
        readonly id: string;
      }[];
      return taken(row).id;
    };
    await expect(
      driver().within(async () => postgres.database.em().isInTransaction()),
    ).resolves.toBe(true);
    await postgres.database.transaction(async () => {
      const outer = await backend();
      await expect(driver().within(backend)).resolves.toBe(outer);
    });
  });
});

describe("Locks over the postgres driver", () => {
  it("serialises a read-modify-write across two instances", async () => {
    await em()
      .fork()
      .execute("create table public.lock_counter (id int primary key, seen int not null)");
    await em().fork().execute("insert into public.lock_counter values (1, 0)");
    const instances = [driver(), driver()].map((each) => new Locks(each, new SystemClockDriver()));
    await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        taken(instances[index % 2]).with("e1", TTL, async () => {
          const [row] = (await em().execute(
            "select seen from public.lock_counter where id = 1",
          )) as unknown as readonly { readonly seen: number }[];
          await sleep(2);
          await em().execute("update public.lock_counter set seen = ? where id = 1", [
            taken(row).seen + 1,
          ]);
        }),
      ),
    );
    const [row] = (await em()
      .fork()
      .execute("select seen from public.lock_counter where id = 1")) as unknown as readonly {
      readonly seen: number;
    }[];
    expect(taken(row).seen).toBe(12);
  });

  it("runs one tryWith of many on one tick", async () => {
    const instances = [driver(), driver(), driver()].map(
      (each) => new Locks(each, new SystemClockDriver()),
    );
    let runs = 0;
    const ran = await Promise.all(
      instances.map((locks) =>
        locks.tryWith("f1", TTL, async () => {
          runs += 1;
          await sleep(100);
        }),
      ),
    );
    expect(ran.filter(Boolean)).toHaveLength(1);
    expect(runs).toBe(1);
  });
});
