/**
 * Stackra file contract:
 * Purpose: behaviour tests of the blueprint's expand and contract steps on a real Postgres engine (PGlite): a column
 *          rename's sync trigger keeps both names equal for a release that writes either, its finish refuses while a
 *          row is not backfilled (also as an owner role that forced row security would show no row) and then drops the
 *          old column; a dropped column waits for its release gate, a retried deploy of that release included; a named
 *          check added to an existing table holds new rows at once and its validation scans the old ones; an
 *          exclusion constraint refuses an overlapping booking (STA-1406).
 * Boundary: test only; each test applies compiled migrations to a fresh in-memory PGlite as the runner would (a
 *           transactional step in one transaction) and plays the runner's ledger and setting where a gate reads them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3: expand and contract); ADR 0160 note of 2026-11-03 (btree_gist); ADR 0022.
 */
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { Extension } from "#core/enums/extension.enum";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { CompiledMigration } from "#core/types/compiled-migration.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";

/** Compiles `up` on the `shop` schema. */
function compiled(up: (schema: SchemaBuilder) => void): CompiledMigration {
  class TestMigration extends Migration {
    up(schema: SchemaBuilder): void {
      up(schema);
    }
  }
  return compileMigration(TestMigration, { schema: "shop", createsSchema: false });
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

/** A fresh database with `shop.orders (id, note varchar(200) not null)` and two rows. */
async function shop(): Promise<PGlite> {
  const pg = new PGlite({ extensions: { btree_gist } });
  await pg.exec(
    "create schema shop; create table shop.orders (id text primary key, note varchar(200) not null); insert into shop.orders values ('a', 'first'), ('b', 'second');",
  );
  return pg;
}

/** The rows of `sql`. */
const rows = async (pg: PGlite, sql: string) => (await pg.query(sql)).rows;

const expand = compiled((schema) =>
  schema.table("orders", (t: Blueprint) => {
    t.renameColumn("note", "memo", { type: "varchar(200)" })
      .nullable()
      .comment("The order's note, under its new name.");
  }),
);

const finish = compiled((schema) =>
  schema.table("orders", (t: Blueprint) => {
    t.finishRenameColumn("note", "memo", { after: "shop.0002_rename_note", type: "varchar(200)" });
  }),
);

describe("BlueprintRecord expand and contract on Postgres", () => {
  it("keeps a renamed column equal under both names, whichever release writes it", async () => {
    const pg = await shop();
    await apply(pg, expand);
    // the release before the rename writes the old name only, the release after it the new name only
    await pg.exec("insert into shop.orders (id, note) values ('c', 'old writer')");
    await pg.exec("insert into shop.orders (id, memo) values ('d', 'new writer')");
    await pg.exec("update shop.orders set note = 'old edit' where id = 'd'");
    await pg.exec("update shop.orders set memo = 'new edit' where id = 'c'");
    expect(await rows(pg, "select id, note, memo from shop.orders order by id")).toEqual([
      { id: "a", note: "first", memo: null },
      { id: "b", note: "second", memo: null },
      { id: "c", note: "new edit", memo: "new edit" },
      { id: "d", note: "old edit", memo: "old edit" },
    ]);
  });

  it("refuses to finish a rename while a row is not backfilled, then drops the old column and trigger", async () => {
    const pg = await shop();
    await apply(pg, expand);
    await expect(apply(pg, finish)).rejects.toThrow(
      /refused before any change: 2 rows of "shop"\."orders" still match/,
    );
    expect(
      await rows(pg, "select count(*)::int as n from shop.orders where note is not null"),
    ).toEqual([{ n: 2 }]);
    // the backfill's work, as a Backfill's set would do it
    await pg.exec("update shop.orders set memo = note where memo is null");
    await apply(pg, finish);
    await pg.exec("insert into shop.orders (id, memo) values ('e', 'after')");
    expect(await rows(pg, "select id, memo from shop.orders order by id")).toEqual([
      { id: "a", memo: "first" },
      { id: "b", memo: "second" },
      { id: "e", memo: "after" },
    ]);
    expect(
      await rows(
        pg,
        "select count(*)::int as n from pg_trigger where tgname = 'trg_orders_note_memo'",
      ),
    ).toEqual([{ n: 0 }]);
  });

  it("refuses to finish a rename as an owner role that forced row security shows no row, keeping the old column", async () => {
    const pg = await shop();
    // the tables' owner, as on a managed Postgres: neither superuser nor BYPASSRLS, and FORCE binds it too
    await pg.exec(`
      create role owner_role nologin;
      grant usage, create on schema shop to owner_role;
      alter table shop.orders owner to owner_role;
      alter table shop.orders enable row level security;
      alter table shop.orders force row level security;
      create policy pol_orders_tenant on shop.orders using (current_setting('app.tenant_id', true) = 'acme');
    `);
    await apply(pg, expand, "owner_role");
    // with app.tenant_id unset the policy shows no row, so a count would find nothing to copy and drop both notes
    await expect(apply(pg, finish, "owner_role")).rejects.toThrow(
      /refused before any change: "shop"\."orders" hides rows from role owner_role under row-level security/,
    );
    expect(await rows(pg, "select id, note, memo from shop.orders order by id")).toEqual([
      { id: "a", note: "first", memo: null },
      { id: "b", note: "second", memo: null },
    ]);
  });

  it("holds a dropped column to its release gate under the runner's ledger", async () => {
    const pg = await shop();
    const drop = compiled((schema) =>
      schema.table("orders", (t: Blueprint) => {
        t.dropColumn("note", { after: "shop.0002_stop_reading_note", type: "varchar(200)" });
      }),
    );
    await pg.exec(
      "create table schema_migrations_history (version bigint primary key, name text not null, checksum text not null, applied_at timestamptz not null default now(), release_id text); insert into schema_migrations_history (version, name, checksum, release_id) values (1, '0001_shop_0001_create_orders', 'x', 'v1'), (2, '0002_shop_0002_stop_reading_note', 'y', 'v2');",
    );
    /** The settings of a run that started at version `from` and applies `release`. */
    const run = (from: number, release: string) =>
      pg.exec(
        `select set_config('stackra.migrate_from_version', '${from}', false), set_config('stackra.migrate_release', '${release}', false)`,
      );
    // release v2 started at version 1 and applied the release the drop waits for itself
    await run(1, "v2");
    await expect(apply(pg, drop)).rejects.toThrow(
      /shop\.orders drop column note is a contract step after shop\.0002_stop_reading_note, which release v2 applies/,
    );
    expect(await rows(pg, "select note from shop.orders order by id")).toHaveLength(2);
    // the same deploy retried starts past it, while v1 may still be serving: still refused
    await run(2, "v2");
    await expect(apply(pg, drop)).rejects.toThrow(/which release v2 applies/);
    expect(await rows(pg, "select note from shop.orders order by id")).toHaveLength(2);
    // the next release
    await run(2, "v3");
    await apply(pg, drop);
    expect(await rows(pg, "select * from shop.orders order by id")).toEqual([
      { id: "a" },
      { id: "b" },
    ]);
  });

  it("checks new rows at once and leaves the old ones to the validation step", async () => {
    const pg = await shop();
    await pg.exec("insert into shop.orders values ('x', '')");
    const check = compiled((schema) =>
      schema.table("orders", (t: Blueprint) => t.check("note_not_blank", "note <> ''")),
    );
    const [add, validate] = check.steps;
    await apply(pg, { after: [], steps: add === undefined ? [] : [add] });
    await expect(pg.exec("insert into shop.orders values ('y', '')")).rejects.toThrow(
      /ck_orders_note_not_blank/,
    );
    await expect(
      apply(pg, { after: [], steps: validate === undefined ? [] : [validate] }),
    ).rejects.toThrow(/ck_orders_note_not_blank/);
    await pg.exec("delete from shop.orders where id = 'x'");
    await apply(pg, { after: [], steps: validate === undefined ? [] : [validate] });
    expect(
      await rows(
        pg,
        "select convalidated from pg_constraint where conname = 'ck_orders_note_not_blank'",
      ),
    ).toEqual([{ convalidated: true }]);
  });

  it("refuses an overlapping booking of one room through the exclusion constraint", async () => {
    const pg = new PGlite({ extensions: { btree_gist } });
    await pg.exec("create schema shop");
    await apply(
      pg,
      compiled((schema) => {
        schema.createExtension(Extension.BtreeGist);
        schema.create("bookings", (t: Blueprint) => {
          t.string("room_id", 33).notNull().comment("The booked room.");
          t.timeRange("during").notNull().comment("When the room is booked.");
          t.timestamp("cancelled_at")
            .nullable()
            .comment("When it was cancelled; null while it stands.");
          t.exclude(
            "no_double_booking",
            { room_id: "=", during: "&&" },
            { where: "cancelled_at is null" },
          );
        });
      }),
    );
    const book = (room: string, from: string, to: string, cancelled = "null") =>
      pg.exec(
        `insert into shop.bookings values ('${room}', tstzrange('2026-12-01 ${from}', '2026-12-01 ${to}'), ${cancelled})`,
      );
    await book("rm_1", "10:00", "11:00");
    await expect(book("rm_1", "10:30", "12:00")).rejects.toThrow(/ex_bookings_no_double_booking/);
    // another room, a cancelled booking and the next hour do not conflict
    await book("rm_2", "10:30", "12:00");
    await book("rm_1", "10:30", "12:00", "now()");
    await book("rm_1", "11:00", "12:00");
    expect(await rows(pg, "select count(*)::int as n from shop.bookings")).toEqual([{ n: 4 }]);
  });
});
