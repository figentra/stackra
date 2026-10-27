/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresIdempotencyStoreDriver` on real Postgres: a free key is claimed once and a
 *          concurrent claim sees it held, a completed key replays its output, a released key may run again, and an
 *          expired key is claimed afresh.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0002 migration creates the table.
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 3); ADR 0396 (decision 2); ADR 0022; ADR 0269.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { CreateActionStoreTablesMigration } from "#node/database/migrations/0002-create-action-store-tables.migration";
import { PostgresIdempotencyStoreDriver } from "#node/drivers/postgres-idempotency-store.driver";
import { usePostgres } from "#testing/use-postgres";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateActionStoreTablesMigration, { schema: "database", createsSchema: true }),
  ],
});

/** The store over the test database. */
const store = () => new PostgresIdempotencyStoreDriver(postgres.database);

describe(PostgresIdempotencyStoreDriver, () => {
  it("claims a free key once; a concurrent claim sees it held", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => store().claim("a:-:usr_1:k1", "f1", Duration.hours(24))),
    );
    expect(results.filter((result) => result === undefined)).toHaveLength(1);
    expect(results.filter((result) => result !== undefined)).toEqual(
      Array.from({ length: 4 }, () => ({ fingerprint: "f1", done: false })),
    );
  });

  it("replays a completed key's output", async () => {
    await store().claim("a:-:usr_1:k2", "f2", Duration.hours(24));
    await store().complete("a:-:usr_1:k2", { orderId: "ord_1" });
    expect(await store().claim("a:-:usr_1:k2", "f2", Duration.hours(24))).toEqual({
      fingerprint: "f2",
      done: true,
      output: { orderId: "ord_1" },
    });
  });

  it("lets a released key run again, and claims an expired key afresh", async () => {
    await store().claim("a:-:usr_1:k3", "f3", Duration.hours(24));
    await store().release("a:-:usr_1:k3");
    expect(await store().claim("a:-:usr_1:k3", "f3", Duration.hours(24))).toBeUndefined();
    await store().claim("a:-:usr_1:k4", "f4", Duration.seconds(0.001));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await store().claim("a:-:usr_1:k4", "other", Duration.hours(24))).toBeUndefined();
  });
});
