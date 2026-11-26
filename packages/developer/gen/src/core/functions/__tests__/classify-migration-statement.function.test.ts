/**
 * Stackra file contract:
 * Purpose: unit tests of `classifyMigrationStatement`: each ADR 0159 class from the statements the schema builder
 *          and raw `schema.sql` steps compile to (adds and relaxations are additive, concurrent builds, index drops and
 *          validations are online, drops, renames, `SET NOT NULL` and type changes are contract, data writes, locks
 *          and write-blocking index builds are banned), a table the same migration created makes any change to it
 *          additive (only after a plain `CREATE TABLE`: `IF NOT EXISTS` may adopt an existing table), comment
 *          lines and literals never change the class, a `DO` block is judged by its body, and an unknown statement or
 *          a string of several statements counts as contract.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3; the 2026-10-23 note); ADR 0334 (rule 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { classifyMigrationStatement } from "#core/functions/classify-migration-statement.function";
import { migrationSafetyRank } from "#core/functions/migration-safety-rank.function";

/** The class of `sql` with no table created before it, or with `created`. */
const classOf = (sql: string, created: readonly string[] = []): string =>
  classifyMigrationStatement(sql, new Set(created)).class;

describe("classifyMigrationStatement", () => {
  /** The expand phase: new objects, nullable or defaulted columns, NOT VALID constraints, grants and comments. */
  it.each([
    'create schema if not exists "orders"',
    'create table "orders"."orders" ("id" varchar(33) not null primary key)',
    'create extension if not exists "pg_trgm"',
    'alter table "orders"."orders" add column "note" text null',
    'alter table "orders"."orders" add column "state" text not null default \'open\'',
    'alter table "orders"."orders" add constraint "ck_orders_note_not_null" check ("note" is not null) not valid',
    'alter table "orders"."orders" alter column "note" drop not null',
    'alter table "orders"."orders" drop constraint if exists "ck_old", add constraint "ck_new" check (a > 0) not valid',
    'alter table "orders"."orders" enable row level security',
    'comment on column "orders"."orders"."note" is \'drop column note when it is empty\'',
    'grant execute on function "orders"."f"() to current_user',
    "revoke update on outbox.changes from public",
    "-- stackra:system-function orders.claim_due claims due rows",
    'create or replace function "orders"."f"() returns int language sql as $f$ delete from x; select 1 $f$',
    "alter type orders.state add value 'held'",
    "select 1",
  ])("classes %s as additive", (sql) => {
    expect(classOf(sql)).toBe("additive");
  });

  /** Steps that run without blocking writes. */
  it.each([
    'create index concurrently if not exists "idx_orders_note" on "orders"."orders" ("note")',
    'create unique index concurrently "idx_orders_ref" on "orders"."orders" ("ref")',
    'drop index concurrently if exists "orders"."idx_orders_note"',
    'alter table "orders"."orders" validate constraint "ck_orders_note_not_null"',
    'reindex index concurrently "orders"."idx_orders_note"',
    'refresh materialized view concurrently "orders"."totals"',
  ])("classes %s as online", (sql) => {
    expect(classOf(sql)).toBe("online");
  });

  /** The contract phase: what the running release may still read or write goes away or narrows. */
  it.each([
    'alter table "orders"."orders" drop column "note"',
    'alter table "orders"."orders" drop column if exists "note"',
    'alter table "orders"."orders" alter column "note" set not null',
    'alter table "orders"."orders" alter column "total" type bigint using "total"::bigint',
    'alter table "orders"."orders" alter column "total" set data type bigint',
    'alter table "orders"."orders" rename column "note" to "memo"',
    'alter table "orders"."orders" rename to "purchases"',
    'alter table "orders"."orders" add column "state" text not null',
    'alter table "orders"."orders" add constraint "fk_orders_customer" foreign key ("customer_id") references "orders"."customers" ("id")',
    'alter table "orders"."orders" add column "a" text null, drop column "b"',
    'drop table "orders"."legacy"',
    'drop table if exists "orders"."legacy" cascade',
    'drop function if exists "orders"."f"(text)',
    'drop policy "pol_orders_tenant_id" on "orders"."orders"',
    'drop schema "orders"',
    'drop materialized view "orders"."totals"',
    "alter type orders.state rename value 'held' to 'paused'",
    'alter function "orders"."f"() rename to g',
    "do $$ begin perform orders.secure('x'); end $$",
    "notify orders",
  ])("classes %s as contract", (sql) => {
    expect(classOf(sql)).toBe("contract");
  });

  /** What never belongs in a migration. */
  it.each([
    'update "orders"."orders" set "tenant_id" = "scope_id" where "tenant_id" is null',
    "insert into orders.states (code) values ('open')",
    "delete from orders.orders where id = 'x'",
    "truncate orders.orders",
    "with moved as (delete from orders.a returning *) insert into orders.b select * from moved",
    'create index "idx_orders_note" on "orders"."orders" ("note")',
    "create unique index idx_orders_ref on only orders.orders (ref)",
    "lock table orders.orders in access exclusive mode",
    "vacuum full orders.orders",
    'reindex table "orders"."orders"',
    'alter table "orders"."orders" set unlogged',
    "do $$ begin update orders.orders set a = 1; end $$",
  ])("classes %s as banned", (sql) => {
    expect(classOf(sql)).toBe("banned");
  });

  /** A table no release reads yet takes any change: its indexes, drops and alters are additive. */
  it("treats a table the same migration created as additive", () => {
    const created = ["orders.orders"];

    expect(classOf('create index "idx_orders_note" on "orders"."orders" ("note")', created)).toBe(
      "additive",
    );
    expect(classOf('alter table "orders"."orders" drop column "note"', created)).toBe("additive");
    expect(classOf("drop table orders.orders", created)).toBe("additive");
    expect(classOf('create index "idx_orders_note" on "orders"."other" ("note")', created)).toBe(
      "banned",
    );
  });

  /** The created table is named so a later statement of the same migration can find it, quoted or not. */
  it("names the table a create statement creates", () => {
    expect(
      classifyMigrationStatement('create table "Orders"."Orders" (id int)', new Set()).creates,
    ).toBe("orders.orders");
    expect(
      classifyMigrationStatement("create unlogged table orders.cache (id int)", new Set()).creates,
    ).toBe("orders.cache");
  });

  /** IF NOT EXISTS may adopt a table a release already uses (database.0005), so it marks nothing created. */
  it("marks no table created by CREATE TABLE IF NOT EXISTS", () => {
    const adopted = classifyMigrationStatement(
      'create unlogged table if not exists "cache"."entries" (key text primary key)',
      new Set(),
    );

    expect(adopted.class).toBe("additive");
    expect(adopted.creates).toBeUndefined();
  });

  /** A schema.sql() string runs every statement in it; read alone, its first one would hide the rest. */
  it("classes a string of several statements as contract", () => {
    expect(classOf("comment on table orders is null; drop table orders")).toBe("contract");
    expect(classOf("select 1; update orders.orders set a = 1")).toBe("contract");
    expect(classOf("select 1;")).toBe("additive");
  });

  /** Comment lines (a squawk ignore, a lint reason) and quoted words are not statements. */
  it("ignores comment lines and string literals", () => {
    expect(
      classOf(
        '-- lint: contract step after the expand phase\n-- squawk-ignore adding-not-nullable-field\nalter table "orders"."orders" alter column "note" set not null',
      ),
    ).toBe("contract");
    expect(classOf("comment on table orders.orders is 'update this; drop table x'")).toBe(
      "additive",
    );
  });

  /** A pre-flight `DO` block that counts and raises reads only; `FOR UPDATE` locks rows, it writes nothing. */
  it("judges a DO block by its body", () => {
    expect(
      classOf(
        "do $$\ndeclare n bigint;\nbegin\n  select count(*) into n from orders.orders where note is null for update;\n  if n > 0 then raise exception 'refused before any change: % rows to update', n; end if;\nend\n$$",
      ),
    ).toBe("additive");
  });

  /** Every class says why, so a refusal and the evidence can name it. */
  it("gives a reason for every class", () => {
    expect(
      classifyMigrationStatement('update "orders"."orders" set a = 1', new Set()).reason,
    ).toMatch(/queue job/);
    expect(classifyMigrationStatement("notify orders", new Set()).reason).toMatch(
      /cannot classify/,
    );
  });

  it("ranks the classes additive, online, contract, banned", () => {
    expect(
      ["banned", "additive", "contract", "online"].map((c) => migrationSafetyRank(c as never)),
    ).toEqual([3, 0, 2, 1]);
  });
});
