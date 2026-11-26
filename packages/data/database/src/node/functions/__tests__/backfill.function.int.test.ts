/**
 * Stackra file contract:
 * Purpose: integration test of `backfill` on real Postgres through its own direct connection: a run of `maxBatches`
 *          hands back unfinished with its progress in `database.backfill_runs`, the next run finishes, every pending
 *          row is filled, and a contract step's `requireBackfill` gate then passes; on a table under forced row-level
 *          security, a URL whose role cannot bypass it (the runtime role) fails with SQLSTATE 42501 and a gate run as
 *          that role is refused, instead of either finding no rows (STA-1406).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0009 migration creates the ledger
 *           and `DATABASE_URL` points `backfill` at the container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs); ADR 0473 (decision 3); ADR 0022; ADR 0269.
 */
import { randomUUID } from "node:crypto";

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

class FillScopedTotalsBackfill extends Backfill({
  key: "shop.fill_scoped_totals",
  table: "shop.scoped_orders",
  pending: "total_minor is null",
  set: "total_minor = subtotal_minor",
  batch: 40,
}) {}

class ContractScopedTotalsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.requireBackfill("shop.fill_scoped_totals", {
      table: "scoped_orders",
      pending: "total_minor is null",
    });
    schema.table("scoped_orders", (t: Blueprint) =>
      t.dropColumn("subtotal_minor", { after: "shop.0002_read_totals", type: "bigint" }),
    );
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

  it("fails closed as a role that forced row security filters, instead of finding no rows", async () => {
    // the tables' owner, as on a managed Postgres: neither superuser nor BYPASSRLS, and FORCE binds it too
    const password = randomUUID();
    await query(`
      create role scoped_owner login password '${password}';
      grant usage on schema shop, database to scoped_owner;
      grant select, insert, update on database.backfill_runs to scoped_owner;
      create table shop.scoped_orders (id text primary key, tenant_id text not null, subtotal_minor bigint not null, total_minor bigint);
      insert into shop.scoped_orders select 'ord_' || n, case when n % 2 = 0 then 'acme' else 'globex' end, n, null from generate_series(1, 10) n;
      alter table shop.scoped_orders owner to scoped_owner;
      alter table shop.scoped_orders enable row level security;
      alter table shop.scoped_orders force row level security;
      create policy pol_scoped_orders_tenant_id on shop.scoped_orders using (tenant_id = current_setting('app.tenant_id', true));
    `);
    const url = new URL(postgres.url);
    url.username = "scoped_owner";
    url.password = password;
    process.env["DATABASE_URL"] = url.toString();
    try {
      // with app.tenant_id unset the policy shows no row: a filtered walk would report finished having copied none
      await expect(backfill(FillScopedTotalsBackfill, { maxBatches: 1 })).rejects.toMatchObject({
        code: "42501",
      });
    } finally {
      process.env["DATABASE_URL"] = postgres.url;
    }
    expect(
      await query(
        "select last_error, finished_at is null as open, rows_done::int as rows_done from database.backfill_runs where key = 'shop.fill_scoped_totals'",
      ),
    ).toEqual([{ last_error: "42501", open: true, rows_done: 0 }]);
    // the gate, run as that role, refuses rather than count 0 rows and let the drop lose every subtotal
    const contract = compileMigration(ContractScopedTotalsMigration, { schema: "shop" });
    await expect(
      query(`set local role scoped_owner;\n${contract.steps[0]?.sql.join(";\n") ?? ""}`),
    ).rejects.toThrow(
      /"shop"\."scoped_orders" hides rows from role scoped_owner under row-level security/,
    );
    expect(
      await query(
        "select count(*)::int as n from shop.scoped_orders where subtotal_minor is not null",
      ),
    ).toEqual([{ n: 10 }]);
    // the migrating role (here the container's superuser) walks every tenant's rows
    expect(await backfill(FillScopedTotalsBackfill)).toMatchObject({ rows: 10, finished: true });
  });
});
