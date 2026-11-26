/**
 * Stackra file contract:
 * Purpose: integration test of `backfill` on real Postgres through its own direct connection: a run of `maxBatches`
 *          hands back unfinished with its progress in `database.backfill_runs`, the next run finishes, every pending
 *          row is filled, and a contract step's `requireBackfill` gate then passes (STA-1406).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0009 migration creates the ledger
 *           and `DATABASE_URL` points `backfill` at the container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs); ADR 0473 (decision 3); ADR 0022; ADR 0269.
 */
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { Backfill } from "#core/bases/backfill.base";
import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { CreateBackfillRunsMigration } from "#node/database/migrations/0009-create-backfill-runs.migration";
import { backfill } from "#node/functions/backfill.function";
import { usePostgres } from "#testing/use-postgres";

class CreateOrdersMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("orders", (t: Blueprint) => {
      t.string("id", 33).notNull().comment("The order's id.");
      t.bigint("subtotal_minor").notNull().comment("Subtotal in minor units.");
      t.bigint("total_minor")
        .nullable()
        .comment("Total in minor units; null until the backfill fills it.");
      t.primary(["id"]);
    });
  }
}

class ContractTotalsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.requireBackfill("shop.fill_totals", { table: "orders", pending: "total_minor is null" });
    schema.table("orders", (t: Blueprint) => t.change("total_minor").notNull());
  }
}

class FillTotalsBackfill extends Backfill({
  key: "shop.fill_totals",
  table: "shop.orders",
  pending: "total_minor is null",
  set: "total_minor = subtotal_minor",
  batch: 40,
}) {}

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateBackfillRunsMigration, { schema: "database", createsSchema: true }),
    compileMigration(CreateOrdersMigration, { schema: "shop", createsSchema: true }),
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            "insert into shop.orders (id, subtotal_minor) select 'ord_' || lpad(n::text, 3, '0'), n * 100 from generate_series(1, 100) n",
          ],
        },
      ],
    },
  ],
});

const previous = { url: process.env["DATABASE_URL"], direct: process.env["DATABASE_DIRECT_URL"] };
beforeAll(() => {
  process.env["DATABASE_URL"] = postgres.url;
  delete process.env["DATABASE_DIRECT_URL"];
});
afterAll(() => {
  if (previous.url === undefined) delete process.env["DATABASE_URL"];
  else process.env["DATABASE_URL"] = previous.url;
  if (previous.direct !== undefined) process.env["DATABASE_DIRECT_URL"] = previous.direct;
});

/** Runs `sql` in a transaction of the fixture database. */
const query = (sql: string) => {
  const { database } = postgres;
  return database.transaction(() => database.em().execute(sql));
};

describe("backfill", () => {
  it("runs in slices that resume from the ledger, then lets the contract step through", async () => {
    const first = await backfill(FillTotalsBackfill, { maxBatches: 2 });
    expect(first).toEqual({
      key: "shop.fill_totals",
      rows: 80,
      batches: 2,
      cursor: "ord_080",
      finished: false,
    });
    const contract = compileMigration(ContractTotalsMigration, { schema: "shop" });
    await expect(query(contract.steps[0]?.sql.join(";\n") ?? "")).rejects.toThrow(
      /20 rows of "shop"\."orders" still match total_minor is null/,
    );
    const second = await backfill(FillTotalsBackfill, { maxBatches: 2 });
    expect(second).toMatchObject({ rows: 100, batches: 3, cursor: "ord_100", finished: true });
    expect(
      await query(
        "select count(*)::int as n from shop.orders where total_minor <> subtotal_minor or total_minor is null",
      ),
    ).toEqual([{ n: 0 }]);
    await query(contract.steps[0]?.sql.join(";\n") ?? "");
  });
});
