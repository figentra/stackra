/**
 * Stackra file contract:
 * Purpose: integration tests of the connection gate of `PostgresDatabaseDriver` on real Postgres (STA-1716): a call
 *          holds its isolation transaction while a `requiresNew` store (the rate-limit take here, as permission's
 *          policy snapshot and the access log do) opens a second connection, so with as many concurrent calls as the
 *          pool has connections every call used to wait for a second one that never came. Now every call finishes,
 *          a chain three connections deep finishes too, a chain deeper than the pool is refused at once, and a call that
 *          waits past `acquireTimeout` is refused as retryable instead of hanging.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0002 migration creates the
 *           bucket table. Each test connects its own small pool on the container `usePostgres` starts. A stall is
 *           reported by `within`, not by the test timeout, so the failure names it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0473 (decision 2 and the 2026-11-26 note: the gate); ADR 0495 (consequences: STA-1716);
 *                     ADR 0217 (decision 2); ADR 0182 (integration tier); ADR 0022.
 */
import { Duration } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionPoolExhaustedError } from "#core/errors/connection-pool-exhausted.error";
import { compileMigration } from "#core/functions/compile-migration.function";
import { CreateActionStoreTablesMigration } from "#node/database/migrations/0002-create-action-store-tables.migration";
import { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";
import { PostgresRateLimitStoreDriver } from "#node/drivers/postgres-rate-limit-store.driver";
import type { DatabasePool } from "#core/types/database-pool.type";
import { usePostgres } from "#testing/use-postgres";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateActionStoreTablesMigration, { schema: "database", createsSchema: true }),
  ],
});

/** How long a test waits before it calls the pool stalled. */
const STALL_MS = 15_000;

/** `work`, or a rejection naming the stall once `ms` passed. */
async function within<T>(ms: number, work: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const stalled = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`stalled: nothing settled within ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([work, stalled]);
  } finally {
    clearTimeout(timer);
  }
}

/** A driver of its own over the test container, with `pool`. */
function connect(pool: Partial<DatabasePool>): Promise<PostgresDatabaseDriver> {
  return PostgresDatabaseDriver.connect({ url: postgres.url, entities: [], pool });
}

/** Runs `work` with a driver of `pool`, closing it after. */
async function withPool<T>(
  pool: Partial<DatabasePool>,
  work: (database: PostgresDatabaseDriver) => Promise<T>,
): Promise<T> {
  const database = await connect(pool);
  try {
    return await work(database);
  } finally {
    await database.close();
  }
}

/** A transaction `depth` connections deep: each level holds its own and opens the next with `requiresNew`. */
function chain(database: PostgresDatabaseDriver, depth: number): Promise<number> {
  return database.transaction(
    async () => {
      // raw-sql: a short hold, so the concurrent calls overlap
      await database.em().execute("select pg_sleep(0.02)");
      return depth === 1 ? 1 : 1 + (await chain(database, depth - 1));
    },
    { requiresNew: true },
  );
}

describe("PostgresDatabaseDriver's connection gate", () => {
  it("finishes as many concurrent calls as the pool has connections, each taking a rate-limit token on a second", async () => {
    const decisions = await withPool({ max: 3 }, async (database) => {
      const store = new PostgresRateLimitStoreDriver(database);
      const now = new Date("2026-11-26T10:00:00.000Z");
      const call = (index: number) =>
        database.transaction(async () => {
          // raw-sql: the call's own work holds its isolation connection while the take opens another
          await database.em().execute("select pg_sleep(0.05)");
          return store.take(`pool:${index % 2}`, { capacity: 100, tokensPerSecond: 0 }, now);
        });
      return within(STALL_MS, Promise.all(Array.from({ length: 9 }, (_, index) => call(index))));
    });
    expect(decisions).toHaveLength(9);
    expect(decisions.every((decision) => decision.allowed)).toBe(true);
  });

  it("finishes concurrent chains three connections deep on a pool of three", async () => {
    const depths = await withPool({ max: 3 }, (database) =>
      within(STALL_MS, Promise.all(Array.from({ length: 9 }, () => chain(database, 3)))),
    );
    expect(depths).toEqual(Array.from({ length: 9 }, () => 3));
  });

  it("refuses at once a chain deeper than the pool, which could never get its connections", async () => {
    await withPool({ max: 2 }, async (database) => {
      await expect(within(STALL_MS, chain(database, 3))).rejects.toThrow(
        /3 connections at once.*pool of 2/,
      );
      // the gate gave back what the refused chain held: a chain the pool can serve still runs
      expect(await within(STALL_MS, chain(database, 2))).toBe(2);
    });
  });

  it("refuses a call that waits past acquireTimeout as retryable, and serves the next one", async () => {
    await withPool({ max: 2, acquireTimeout: Duration.seconds(0.2) }, async (database) => {
      // raw-sql: holds the one top-level place a pool of two keeps beside its nested one
      const holding = database.transaction(() => database.em().execute("select pg_sleep(1)"));
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
      const refused = await within(
        STALL_MS,
        database
          .transaction(() => database.em().execute("select 1"))
          .then(
            () => undefined,
            (error: unknown) => error,
          ),
      );
      expect(isRefusal(refused, ConnectionPoolExhaustedError)).toBe(true);
      await holding;
      expect(await within(STALL_MS, chain(database, 2))).toBe(2);
    });
  });
});
