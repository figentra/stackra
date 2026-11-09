/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresIdempotencyStoreDriver` on real Postgres: a free key is claimed once and a
 *          concurrent claim sees it held, a completed key replays its output, a released key may run again, an
 *          expired key is claimed afresh, and a key claimed and completed inside an outer transaction whose commit
 *          fails is gone, so the retry runs again instead of replaying.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0002 migration creates the table.
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 3); ADR 0396 (decision 2); ADR 0022; ADR 0269.
 */
import { Duration } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { AddIdempotencyRefusalMigration } from "#node/database/migrations/0008-add-idempotency-refusal.migration";
import { CreateActionStoreTablesMigration } from "#node/database/migrations/0002-create-action-store-tables.migration";
import { PostgresIdempotencyStoreDriver } from "#node/drivers/postgres-idempotency-store.driver";
import { usePostgres } from "#testing/use-postgres";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateActionStoreTablesMigration, { schema: "database", createsSchema: true }),
    compileMigration(AddIdempotencyRefusalMigration, { schema: "database" }),
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
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(await store().claim("a:-:usr_1:k4", "other", Duration.hours(24))).toBeUndefined();
  });

  it("runs a retry again when the outer transaction it completed in fails to commit", async () => {
    const em = () => postgres.database.em();
    // raw-sql: a deferred unique constraint, checked only at commit, so the commit itself fails
    await em().execute(
      "create table if not exists public.commit_probe (id int, constraint uq_commit_probe unique (id) deferrable initially deferred)",
    );
    const call = async () => {
      expect(await store().claim("a:-:usr_1:k5", "f5", Duration.hours(24))).toBeUndefined();
      // raw-sql: two equal rows: allowed until the deferred check runs at commit
      await em().execute("insert into public.commit_probe (id) values (1), (1)");
      await store().complete("a:-:usr_1:k5", { orderId: "ord_5" });
    };
    await expect(postgres.database.transaction(call)).rejects.toThrow();
    // the claim and the completion rolled back with the outer commit: the retry runs, it does not replay
    expect(await store().claim("a:-:usr_1:k5", "f5", Duration.hours(24))).toBeUndefined();
  });

  it("keeps a refusal recorded after the call's transaction rolled back, and replays it", async () => {
    const refusal = {
      kind: ErrorKind.Conflict,
      code: "out_of_stock",
      category: "conflict",
      retryable: false,
      details: { sku: "a" },
    } as const;
    const call = async () => {
      expect(await store().claim("a:-:usr_1:k6", "f6", Duration.hours(24))).toBeUndefined();
      throw new Error("refused");
    };
    await expect(postgres.database.transaction(call)).rejects.toThrow("refused");
    // the claim rolled back with the call, so the refusal is an insert, not an update
    await store().completeRefused("a:-:usr_1:k6", "f6", refusal, Duration.hours(24));
    expect(await store().claim("a:-:usr_1:k6", "f6", Duration.hours(24))).toEqual({
      fingerprint: "f6",
      done: true,
      refusal,
    });
    // a held key becomes the refusal too
    await store().claim("a:-:usr_1:k7", "f7", Duration.hours(24));
    await store().completeRefused("a:-:usr_1:k7", "f7", refusal, Duration.hours(24));
    expect(await store().claim("a:-:usr_1:k7", "f7", Duration.hours(24))).toMatchObject({
      done: true,
      refusal,
    });
  });
});
