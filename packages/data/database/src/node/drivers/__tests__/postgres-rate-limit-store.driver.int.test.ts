/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresRateLimitStoreDriver` on real Postgres: a bucket starts full, refuses once
 *          empty with the wait until the next token, refills with time, never refills at rate 0, and concurrent takes
 *          never take more tokens than the bucket holds.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0002 migration creates the table.
 * Runtime: node (vitest)
 * Governing contract: ADR 0217 (decision 2); ADR 0396 (decision 2); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { CreateActionStoreTablesMigration } from "#node/database/migrations/0002-create-action-store-tables.migration";
import { PostgresRateLimitStoreDriver } from "#node/drivers/postgres-rate-limit-store.driver";
import { usePostgres } from "#testing/use-postgres.fixture";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateActionStoreTablesMigration, { schema: "database", createsSchema: true }),
  ],
});

const start = new Date("2026-10-26T10:00:00.000Z");

/** `seconds` after the start. */
const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);

/** The store over the test database. */
const store = () => new PostgresRateLimitStoreDriver(postgres.database);

describe(PostgresRateLimitStoreDriver, () => {
  it("starts full, refuses once empty with the wait, and refills with time", async () => {
    const bucket = { capacity: 2, tokensPerSecond: 0.5 };
    expect(await store().take("b1", bucket, at(0))).toEqual({
      allowed: true,
      remaining: 1,
      retryAfterMs: 0,
    });
    await store().take("b1", bucket, at(0));
    expect(await store().take("b1", bucket, at(0))).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterMs: 2000,
    });
    expect((await store().take("b1", bucket, at(2))).allowed).toBe(true);
  });

  it("never refills a bucket at rate 0, and refuses a capacity it cannot hold", async () => {
    const bucket = { capacity: 1, tokensPerSecond: 0 };
    await store().take("b2", bucket, at(0));
    expect((await store().take("b2", bucket, at(3600))).retryAfterMs).toBe(Infinity);
    await expect(
      store().take("b3", { capacity: 3_000_000, tokensPerSecond: 1 }, at(0)),
    ).rejects.toThrow(RangeError);
  });

  it("never lets concurrent takes exceed the bucket", async () => {
    const bucket = { capacity: 3, tokensPerSecond: 0 };
    const decisions = await Promise.all(
      Array.from({ length: 8 }, () => store().take("b4", bucket, at(0))),
    );
    expect(decisions.filter((decision) => decision.allowed)).toHaveLength(3);
  });
});
