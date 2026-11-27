/**
 * Stackra file contract:
 * Purpose: behaviour tests of the schema builder's table steps on a real Postgres engine (PGlite): a renamed table stays
 *          readable and writable under its old name through a view that keeps the caller's row-level security, its
 *          finish drops the view behind the release gate, a dropped table waits for its gate (a retried deploy of the
 *          release that applied the step it waits for, or a run naming no release, is refused), and `requireBackfill`
 *          refuses while a row is pending, passes on a database with none, and refuses a role that row-level security
 *          would filter, or that lacks SELECT on the table, instead of counting the rows it can see (STA-1406).
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

/** Applies `migration` to `pg` step by step, as the runner does, as `role` when one is named. */
async function apply(pg: PGlite, migration: CompiledMigration, role?: string): Promise<void> {
  for (const step of migration.steps) {
    const sql =
      (role === undefined ? "" : `set local role ${role};\n`) +
      step.sql.map((statement) => `${statement};\n`).join("");
    if (step.transactional) await pg.transaction((tx) => tx.exec(sql));
    else for (const statement of step.sql) await pg.exec(statement);
  }
}

/** The rows of `sql`. */
const rows = async (pg: PGlite, sql: string) => (await pg.query(sql)).rows;

/**
 * The runner's ledger, with the files of `applied` (name, release) applied as versions 1, 2, …, and the settings of a
 * run that started at version `from` and applies `release`.
 */
async function ledger(
  pg: PGlite,
  applied: readonly (readonly [string, string | null])[],
  from: number,
  release?: string,
): Promise<void> {
  await pg.exec(
    "create table schema_migrations_history (version bigint primary key, name text not null, checksum text not null, applied_at timestamptz not null default now(), release_id text)",
  );
  for (const [index, [name, applier]] of applied.entries())
    await pg.exec(
      `insert into schema_migrations_history (version, name, checksum, release_id) values (${index + 1}, '${name}', 'x', ${applier === null ? "null" : `'${applier}'`})`,
    );
  await run(pg, from, release);
}

/** The settings of a run that started at version `from` and applies `release` (none when absent). */
async function run(pg: PGlite, from: number, release?: string): Promise<void> {
  await pg.exec(
    `select set_config('stackra.migrate_from_version', '${from}', false), set_config('stackra.migrate_release', '${release ?? ""}', false)`,
  );
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
    await ledger(
      pg,
      [
        ["0001_shop_0001_create_customer", "v1"],
        ["0002_shop_0002_rename_customer", "v2"],
      ],
      1,
      "v2",
    );
    await expect(apply(pg, finish)).rejects.toThrow(
      /shop\.customer finish rename to customers is a contract step after shop\.0002_rename_customer, which release v2 applies/,
    );
    expect(await rows(pg, "select count(*)::int as n from shop.customer")).toEqual([{ n: 2 }]);
    // the same deploy retried starts past the rename, and is still the release that applied it
    await run(pg, 2, "v2");
    await expect(apply(pg, finish)).rejects.toThrow(/which release v2 applies/);
    expect(await rows(pg, "select to_regclass('shop.customer') is not null as view")).toEqual([
      { view: true },
    ]);
    await run(pg, 2, "v3");
    await apply(pg, finish);
    expect(await rows(pg, "select to_regclass('shop.customer') as view")).toEqual([{ view: null }]);
    expect(await rows(pg, "select count(*)::int as n from shop.customers")).toEqual([{ n: 2 }]);
  });

  it("drops a table only past its release gate", async () => {
    const pg = await scopedRows();
    const drop = compiled((schema) =>
      schema.drop("customer", { after: "shop.0002_stop_using_customer" }),
    );
    await ledger(pg, [["0001_shop_0001_create_customer", null]], 1, "v2");
    // the release it waits for was never applied
    await expect(apply(pg, drop)).rejects.toThrow(
      /refused before any change: shop\.customer drop is a contract step after shop\.0002_stop_using_customer, which is not applied/,
    );
    await pg.exec(
      "insert into schema_migrations_history (version, name, checksum, release_id) values (2, '0002_shop_0002_stop_using_customer_1', 'x', 'v2')",
    );
    // a run that names no release cannot be told from the one that applied it
    await run(pg, 2);
    await expect(apply(pg, drop)).rejects.toThrow(/this run names no release/);
    await run(pg, 2, "v3");
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
    // a step recorded before the ledger kept releases belongs to an older release
    const recordedBefore = await scopedRows();
    await ledger(
      recordedBefore,
      [
        ["0001_shop_0001_create_customer", null],
        ["0002_shop_0002_stop_using_customer", null],
      ],
      2,
      "v3",
    );
    await apply(recordedBefore, drop);
    const unledgered = await scopedRows();
    await apply(unledgered, drop);
    const rollbackEnvironment = await scopedRows();
    await ledger(rollbackEnvironment, [["0001_shop_0001_create_customer", "v1"]], 1);
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

  it("refuses a contract step as a role row security filters, rather than count the rows its policy shows", async () => {
    const pg = await scopedRows();
    // the tables' owner, as on a managed Postgres: neither superuser nor BYPASSRLS, and FORCE binds it too
    await pg.exec(`
      alter table shop.customer add column email text;
      create role owner_role nologin;
      grant usage, create on schema shop to owner_role;
      alter table shop.customer owner to owner_role;
    `);
    const contract = compiled((schema) => {
      schema.requireBackfill("shop.fill_emails", { table: "customer", pending: "email is null" });
      schema.table("customer", (t) =>
        t.dropColumn("name", { after: "shop.0002_copy_name", type: "text" }),
      );
    });
    // with app.tenant_id unset the policy shows no row: a count would be 0 and the drop would lose both names
    await expect(apply(pg, contract, "owner_role")).rejects.toThrow(
      /refused before any change: role owner_role cannot count the pending rows of "shop"\."customer" \(.*\): it lacks SELECT on the table, or row-level security would hide rows from it/,
    );
    expect(await rows(pg, "select name from shop.customer order by id")).toEqual([
      { name: "Ada" },
      { name: "Grace" },
    ]);
    // a role that bypasses row security counts every tenant's rows
    await expect(apply(pg, contract)).rejects.toThrow(
      /2 rows of "shop"\."customer" still match email is null/,
    );
    await pg.exec("update shop.customer set email = name || '@example.test'");
    await apply(pg, contract);
    expect(await rows(pg, "select id, email from shop.customer order by id")).toEqual([
      { id: "c1", email: "Ada@example.test" },
      { id: "c2", email: "Grace@example.test" },
    ]);
  });

  it("refuses a contract step as a role without SELECT on the table, naming the missing grant", async () => {
    const pg = new PGlite();
    // no row-level security here: the role simply was never granted SELECT on the table it migrates
    await pg.exec(`
      create schema shop;
      create table shop.invoice (id text primary key, number text);
      insert into shop.invoice values ('i1', null);
      create role migrator nologin;
      grant usage, create on schema shop to migrator;
    `);
    const gate = compiled((schema) =>
      schema.requireBackfill("shop.fill_numbers", { table: "invoice", pending: "number is null" }),
    );
    await expect(apply(pg, gate, "migrator")).rejects.toThrow(
      /refused before any change: role migrator cannot count the pending rows of "shop"\."invoice" \(permission denied for table invoice\): it lacks SELECT on the table/,
    );
    await pg.exec("grant select on shop.invoice to migrator");
    await expect(apply(pg, gate, "migrator")).rejects.toThrow(
      /1 rows of "shop"\."invoice" still match number is null/,
    );
  });
});
