/**
 * Stackra file contract:
 * Purpose: behaviour tests of the schema builder's table steps on a real Postgres engine (PGlite): a renamed table stays
 *          readable and writable under its old name through a view that keeps the caller's row-level security, its
 *          finish drops the view behind the release gate, a dropped table waits for its gate, and `requireBackfill`
 *          refuses while a row is pending and passes on a database with none (STA-1406).
 * Boundary: test only; each test applies compiled migrations to a fresh in-memory PGlite as the runner would, and plays
 *           the runner's ledger and setting where a gate reads them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3: expand and contract, backfills as queue jobs); ADR 0239 (row security);
 *                     ADR 0022.
 */
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { CompiledMigration } from "#core/types/compiled-migration.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";

/** Compiles `up` on the `shop` schema. */
function compiled(up: (schema: SchemaBuilder) => void): CompiledMigration {
  class TestMigration extends Migration {
    up(schema: SchemaBuilder): void {
      up(schema);
    }
  }
  return compileMigration(TestMigration, { schema: "shop" });
}

/** Applies `migration` to `pg` step by step, as the runner does. */
async function apply(pg: PGlite, migration: CompiledMigration): Promise<void> {
  for (const step of migration.steps) {
    const sql = step.sql.map((statement) => `${statement};\n`).join("");
    if (step.transactional) await pg.transaction((tx) => tx.exec(sql));
    else for (const statement of step.sql) await pg.exec(statement);
  }
}

/** The rows of `sql`. */
const rows = async (pg: PGlite, sql: string) => (await pg.query(sql)).rows;

/** The runner's ledger, with the files of `names` applied as versions 1, 2, … */
async function ledger(pg: PGlite, names: readonly string[], from: number): Promise<void> {
  await pg.exec(
    "create table schema_migrations_history (version bigint primary key, name text not null, checksum text not null, applied_at timestamptz not null default now())",
  );
  for (const [index, name] of names.entries())
    await pg.exec(
      `insert into schema_migrations_history (version, name, checksum) values (${index + 1}, '${name}', 'x')`,
    );
  await pg.exec(`select set_config('stackra.migrate_from_version', '${from}', false)`);
}

/** A table under forced row-level security on `app.tenant_id`, with a row for each of two owners and an unprivileged reader. */
async function scopedRows(): Promise<PGlite> {
  const pg = new PGlite();
  await pg.exec(`
    create schema shop;
    create table shop.customer (id text primary key, tenant_id text not null, name text not null);
    alter table shop.customer enable row level security;
    alter table shop.customer force row level security;
    create policy pol_customer_tenant_id on shop.customer using (tenant_id = current_setting('app.tenant_id', true)) with check (tenant_id = current_setting('app.tenant_id', true));
    insert into shop.customer values ('c1', 'acme', 'Ada'), ('c2', 'globex', 'Grace');
    create role reader nologin;
    grant usage on schema shop to reader;
  `);
  return pg;
}

/** The names `reader` sees through `relation` with `app.tenant_id` set to `owner`. */
async function namesAs(pg: PGlite, relation: string, owner: string): Promise<string[]> {
  return pg.transaction(async (tx) => {
    await tx.exec(`set local role reader; select set_config('app.tenant_id', '${owner}', true)`);
    const found = await tx.query<{ name: string }>(`select name from ${relation} order by id`);
    return found.rows.map((row) => row.name);
  });
}

describe("SchemaRecord table steps on Postgres", () => {
  it("keeps a renamed table under its old name, writable, with the caller's row security", async () => {
    const pg = await scopedRows();
    await apply(
      pg,
      compiled((schema) => schema.rename("customer", "customers")),
    );
    await pg.exec(
      "grant select, insert, update on shop.customers to reader; grant select, insert, update on shop.customer to reader",
    );
    // the release before the rename still names the old table, and sees its own tenant only
    expect(await namesAs(pg, "shop.customer", "acme")).toEqual(["Ada"]);
    expect(await namesAs(pg, "shop.customer", "globex")).toEqual(["Grace"]);
    await pg.exec("insert into shop.customer values ('c3', 'acme', 'Alan')");
    await pg.exec("update shop.customer set name = 'Ada L.' where id = 'c1'");
    expect(await rows(pg, "select id, name from shop.customers order by id")).toEqual([
      { id: "c1", name: "Ada L." },
      { id: "c2", name: "Grace" },
      { id: "c3", name: "Alan" },
    ]);
  });

  it("finishes a table rename behind its release gate, dropping the view", async () => {
    const pg = await scopedRows();
    await apply(
      pg,
      compiled((schema) => schema.rename("customer", "customers")),
    );
    const finish = compiled((schema) =>
      schema.finishRename("customer", "customers", { after: "shop.0002_rename_customer" }),
    );
    await ledger(pg, ["0001_shop_0001_create_customer", "0002_shop_0002_rename_customer"], 1);
    await expect(apply(pg, finish)).rejects.toThrow(
      /shop\.customer finish rename to customers is a contract step after shop\.0002_rename_customer/,
    );
    expect(await rows(pg, "select count(*)::int as n from shop.customer")).toEqual([{ n: 2 }]);
    await pg.exec("select set_config('stackra.migrate_from_version', '2', false)");
    await apply(pg, finish);
    expect(await rows(pg, "select to_regclass('shop.customer') as view")).toEqual([{ view: null }]);
    expect(await rows(pg, "select count(*)::int as n from shop.customers")).toEqual([{ n: 2 }]);
  });

  it("drops a table only past its release gate", async () => {
    const pg = await scopedRows();
    const drop = compiled((schema) =>
      schema.drop("customer", { after: "shop.0002_stop_using_customer" }),
    );
    await ledger(pg, ["0001_shop_0001_create_customer"], 1);
    // the release it waits for was never applied
    await expect(apply(pg, drop)).rejects.toThrow(/refused before any change/);
    await pg.exec(
      "insert into schema_migrations_history (version, name, checksum) values (2, '0002_shop_0002_stop_using_customer_1', 'x'); select set_config('stackra.migrate_from_version', '2', false)",
    );
    await apply(pg, drop);
    expect(await rows(pg, "select to_regclass('shop.customer') as t")).toEqual([{ t: null }]);
  });

  it("passes the release gate on a fresh database, with no ledger, and with the setting unset", async () => {
    const drop = compiled((schema) =>
      schema.drop("customer", { after: "shop.0002_stop_using_customer" }),
    );
    const fresh = await scopedRows();
    await ledger(fresh, [], 0);
    await apply(fresh, drop);
    const unledgered = await scopedRows();
    await apply(unledgered, drop);
    const rollbackEnvironment = await scopedRows();
    await ledger(rollbackEnvironment, ["0001_shop_0001_create_customer"], 1);
    await rollbackEnvironment.exec("select set_config('stackra.migrate_from_version', '', false)");
    await apply(rollbackEnvironment, drop);
  });

  it("refuses a contract step while a backfill has rows to reach, and passes once it has none", async () => {
    const pg = new PGlite();
    await pg.exec(
      "create schema shop; create table shop.orders (id text primary key, subtotal bigint not null, total bigint); insert into shop.orders values ('a', 5, null), ('b', 7, 7);",
    );
    const contract = compiled((schema) => {
      schema.requireBackfill("shop.fill_totals", { table: "orders", pending: "total is null" });
      schema.table("orders", (t) => t.change("total").notNull());
    });
    await expect(apply(pg, contract)).rejects.toThrow(
      /1 rows of "shop"\."orders" still match total is null: the backfill shop\.fill_totals has not finished/,
    );
    await pg.exec("update shop.orders set total = subtotal where total is null");
    await apply(pg, contract);
    expect(
      await rows(
        pg,
        "select is_nullable from information_schema.columns where table_schema = 'shop' and table_name = 'orders' and column_name = 'total'",
      ),
    ).toEqual([{ is_nullable: "NO" }]);
  });
});
