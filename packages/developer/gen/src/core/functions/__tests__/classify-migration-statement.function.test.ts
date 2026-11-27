/**
 * Stackra file contract:
 * Purpose: unit tests of `classifyMigrationStatement`: each ADR 0159 class from the statements the schema builder
 *          and raw `schema.sql` steps compile to (adds and relaxations are additive, concurrent builds, index drops and
 *          validations are online, drops, renames, `SET NOT NULL` and type changes are contract, data writes, locks
 *          and write-blocking index builds are banned), a table the same migration created makes any change to it
 *          additive (only after a plain `CREATE TABLE`: `IF NOT EXISTS` may adopt an existing table), comments
 *          (inline and block ones too), literals and quoted names never change the class, a read or a `DO` block that
 *          calls a function gen does not know to be read-only counts as contract, `SELECT … INTO` is banned, a `DO`
 *          block is judged by its body, and an unknown statement or a string of several statements counts as contract;
 *          a call is read from its whole name in any script, and an added column that rewrites the table (a volatile
 *          default, a `serial`, a stored generated or identity column) is contract while a constant or stable default
 *          stays additive; row level security enabled or forced, a restrictive policy, a changed policy and a revoked
 *          privilege are contract unless they touch a table the same migration created.
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
    'alter table "orders"."orders" disable row level security',
    'alter table "orders"."orders" no force row level security',
    'create policy "pol_orders_read" on "orders"."orders" as permissive for select using (true)',
    'comment on column "orders"."orders"."note" is \'drop column note when it is empty\'',
    'grant execute on function "orders"."f"() to current_user',
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

  /** A comment anywhere is not code: an inline `--` or a block comment never lowers the class (STA-2866 review). */
  it("ignores inline and block comments", () => {
    expect(classOf("alter table orders add column note text not null /* default later */")).toBe(
      "contract",
    );
    expect(classOf("alter table orders add constraint c check (x > 0) -- not valid")).toBe(
      "contract",
    );
    expect(
      classOf("alter table orders /* a /* nested */ not valid */ add constraint c check (x > 0)"),
    ).toBe("contract");
    expect(classOf("alter table orders add column note text null -- not null")).toBe("additive");
    expect(classOf("comment on table orders.orders is 'not -- a comment'")).toBe("additive");
  });

  /** A quoted name is a name, never a keyword: a column called "generated" is no generated column. */
  it("reads a quoted name as a name, not a keyword", () => {
    expect(classOf('alter table "orders"."orders" add column "generated" boolean not null')).toBe(
      "contract",
    );
    expect(classOf('alter table "orders"."orders" add constraint "not valid" check (a > 0)')).toBe(
      "contract",
    );
    expect(classOf('with x as (select * from "update") select 1')).toBe("additive");
    expect(classOf('create index "i" on "Orders"."Orders" ("id")', ["orders.orders"])).toBe(
      "additive",
    );
  });

  /** A function may delete or backfill rows, so a read that calls one gen cannot vouch for is destructive. */
  it.each([
    "select purge_tenant_data()",
    "select * from purge_tenant_data()",
    "select orders.backfill_totals(100)",
    'select "count"(*) from orders.orders',
    "select evil.set_config('a', 'b', true)",
    "select nextval('orders.seq')",
    "with x as (select purge_tenant_data()) select 1",
    "select e'\\'', purge_tenant_data(), 'x'",
  ])("classes the read %s as contract", (sql) => {
    expect(classOf(sql)).toBe("contract");
  });

  /** Aggregates, settings and advisory locks write nothing. */
  it.each([
    "select count(*) from orders.orders where note is null",
    "select set_config('search_path', '', true)",
    "select pg_catalog.set_config('lock_timeout', '5s', true)",
    "select pg_advisory_xact_lock(42)",
    "select pg_try_advisory_lock(42)",
    "select 1 where exists (select 1 from orders.orders where id in (1, 2))",
    "select '1'::numeric(10, 2)",
  ])("classes the read %s as additive", (sql) => {
    expect(classOf(sql)).toBe("additive");
  });

  /** `SELECT … INTO` creates a table and copies rows into it: a backfill, never a migration step. */
  it("classes SELECT INTO as banned", () => {
    expect(classOf("select * into orders.archive from orders.orders")).toBe("banned");
  });

  /** A table filled by a query copies rows; a materialized view or a temporary table is judged by its query. */
  it.each([
    ["create table orders.archive as select * from orders.orders", "banned"],
    ['create unlogged table "orders"."archive" (id) as table orders.orders', "banned"],
    ["create table orders.archive as select * from orders.orders with no data", "additive"],
    ["create temp table purged as select purge_tenant_data()", "contract"],
    ["create temporary table counted as select count(*) from orders.orders", "additive"],
    ["create materialized view orders.totals as select purge_tenant_data()", "contract"],
    ["create materialized view orders.totals as select sum(total) from orders.orders", "additive"],
    ["create materialized view orders.totals as execute totals_plan", "contract"],
    ["create table orders.lines (id bigint generated always as (1) stored)", "additive"],
  ])("classes %s as %s", (sql, expected) => {
    expect(classOf(sql)).toBe(expected);
  });

  /** A `DO` block that calls an unknown function, assigns from one or hides its body in a literal is destructive. */
  it.each([
    "do $$ declare n int; begin n := purge_rows(); end $$",
    "do $$ begin if orders.purge() then raise notice 'done'; end if; end $$",
    "do $body$ begin select purge_rows() into strict n; end $body$",
    "do $$ begin lock table orders.orders; end $$",
    "do 'begin raise notice ''x''; end'",
    "do $$ begin null; /* perform */ n := purge_rows(); end $$",
  ])("classes %s as contract", (sql) => {
    expect(classOf(sql)).toBe("contract");
  });

  /** A pre-flight `DO` block that counts and raises reads only; `FOR UPDATE` locks rows, it writes nothing. */
  it("judges a DO block by its body", () => {
    expect(
      classOf(
        "do $$\ndeclare n bigint;\nbegin\n  select count(*) into n from orders.orders where note is null for update;\n  if n > 0 then raise exception 'refused before any change: % rows to update', n; end if;\nend\n$$",
      ),
    ).toBe("additive");
    expect(
      classOf(
        "do language plpgsql $$ declare n int; begin n := (select count(*) from orders.orders); -- purge()\n if n > 0 then raise exception 'perform purge() first'; end if; end $$",
      ),
    ).toBe("additive");
  });

  /** The pre-flights gen's own builder and the released migrations write stay additive (settings.0004 among them). */
  it("keeps the released pre-flight DO blocks additive", () => {
    expect(
      classOf(
        [
          "do $$",
          "declare",
          "  found text[] := '{}';",
          "  n bigint;",
          "begin",
          '  select count(*) into n from "settings"."stored_settings" where "tenant_id" is null and (nlevel("scope_path") > 3);',
          "  if n > 0 then found := found || format('%s %s', 'settings.stored_settings', n); end if;",
          "  if cardinality(found) > 0 then",
          "    raise exception 'refused before any change: rows with a null %: %. %', 'tenant_id', array_to_string(found, ', '), 'fill it';",
          "  end if;",
          "end",
          "$$",
        ].join("\n"),
      ),
    ).toBe("additive");
    expect(
      classOf(
        [
          "do $$",
          "declare",
          "  n bigint;",
          "begin",
          '  select count(*) into n from (select 1 from "settings"."stored_settings" where "user_id" is not null',
          '    group by "tenant_id", "group_key", "user_id" having count(*) > 1) as duplicated;',
          "  if n > 0 then",
          "    raise exception 'refused before any change: settings.stored_settings %. %', n, 'merge them';",
          "  end if;",
          "end",
          "$$",
        ].join("\n"),
      ),
    ).toBe("additive");
  });

  /** A call is read from its whole name in any script, never from the tail of a longer word (STA-2866 review). */
  it.each([
    "select ücount(x) from orders.orders",
    "select åbackfill_totals(100)",
    "select orders.ünlock_rows()",
    "with x as (select 9purge(1)) select 1",
  ])("classes the read %s as contract", (sql) => {
    expect(classOf(sql)).toBe("contract");
  });

  /** An added column every existing row must be filled for rewrites the table under a lock (STA-2866 review). */
  it.each([
    'alter table "orders"."orders" add column "ref" uuid not null default gen_random_uuid()',
    'alter table "orders"."orders" add column "ref" uuid default pg_catalog.gen_random_uuid()',
    'alter table "orders"."orders" add column "seen_at" timestamptz default clock_timestamp()',
    'alter table "orders"."orders" add column "n" bigint default nextval(\'orders.seq\')',
    'alter table "orders"."orders" add column "n" bigserial',
    "alter table orders.orders add column n serial4 not null",
    'alter table "orders"."orders" add column "n" bigint generated always as identity',
    'alter table "orders"."orders" add column "n" int generated by default as identity (start 10)',
    'alter table "orders"."orders" add column "total" bigint generated always as ("a" + "b") stored',
    'alter table "orders"."orders" add column "ref" text default orders.next_ref()',
    'alter table "orders"."orders" add column "a" text null, add column "ref" uuid default gen_random_uuid()',
  ])("classes %s as contract", (sql) => {
    const classified = classifyMigrationStatement(sql, new Set());
    expect(classified.class).toBe("contract");
    expect(classified.reason).toMatch(/rewrites the table/);
  });

  /** A constant or stable default is stored once as metadata, so the column is added without a rewrite. */
  it.each([
    'alter table "orders"."orders" add column "created_at" timestamptz not null default now()',
    'alter table "orders"."orders" add column "created_at" timestamptz not null default current_timestamp',
    'alter table "orders"."orders" add column "created_at" timestamptz default current_timestamp(3)',
    'alter table "orders"."orders" add column "at" timestamp default (now() at time zone \'utc\')',
    'alter table "orders"."orders" add column "meta" jsonb not null default \'{}\'::jsonb',
    'alter table "orders"."orders" add column "tags" text[] not null default array[]::text[]',
    'alter table "orders"."orders" add column "state" text default \'open\' check (length("state") > 0)',
    'alter table "orders"."orders" add column "customer_id" varchar(33) default null references "orders"."customers" ("id")',
    'alter table "orders"."orders" add column "tenant" text default current_setting(\'app.tenant\', true)',
    'alter table "orders"."orders" add column "serial_no" text null',
  ])("classes %s as additive", (sql) => {
    expect(classOf(sql)).toBe("additive");
  });

  /** A table the same migration created holds no row yet, so even a volatile default rewrites nothing that is read. */
  it("keeps a volatile default on a table this migration created additive", () => {
    expect(
      classOf('alter table "orders"."orders" add column "ref" uuid default gen_random_uuid()', [
        "orders.orders",
      ]),
    ).toBe("additive");
  });

  /**
   * Security that narrows what the running release reads or writes is a contract step like a dropped column: row
   * level security turned on or forced, a restrictive policy, a changed policy, a revoked privilege (CTO review of
   * STA-2866).
   */
  it.each([
    'alter table "orders"."orders" enable row level security',
    'alter table "orders"."orders" force row level security',
    "alter table if exists only orders.orders enable row level security",
    'alter table "orders"."orders" add column "a" text null, force row level security',
    'create policy "pol_orders_tenant" on "orders"."orders" as restrictive for all using (tenant_id = current_setting(\'app.tenant\'))',
    'create policy "pol_orders_tenant" on "orders"."orders" as restrictive using (true)',
    'alter policy "pol_orders_tenant_id" on "orders"."orders" using (tenant_id = current_setting(\'app.tenant\'))',
    'alter policy "pol_orders_tenant_id" on "orders"."orders" to app_reader',
    'alter policy "pol_steps_tenant_id" on "ai"."run_steps" rename to "pol_run_steps_tenant_id"',
    "revoke update on outbox.changes from public",
    'revoke update, delete on table "orders"."orders" from "app"',
    "revoke all on function outbox.secure_change_partition(text) from public",
    "revoke grant option for select on orders.orders from app_reader",
    "revoke usage on schema orders from public",
    'revoke update on "orders"."orders", "orders"."lines" from public',
    "alter default privileges in schema orders revoke select on tables from app_reader",
  ])("classes %s as contract", (sql) => {
    const classified = classifyMigrationStatement(sql, new Set());
    expect(classified.class).toBe("contract");
    expect(classified.reason).toMatch(/row level security|policy|revokes/);
  });

  /** On a table no release reads yet, the same security steps are additive: nothing running loses a row or a right. */
  it("keeps security steps on a table this migration created additive", () => {
    const created = ["orders.orders"];

    expect(classOf('alter table "orders"."orders" enable row level security', created)).toBe(
      "additive",
    );
    expect(classOf('alter table "orders"."orders" force row level security', created)).toBe(
      "additive",
    );
    expect(
      classOf(
        'create policy "p" on "orders"."orders" as restrictive using (tenant_id = current_setting(\'app.tenant\'))',
        created,
      ),
    ).toBe("additive");
    expect(classOf('alter policy "p" on "orders"."orders" to app_reader', created)).toBe(
      "additive",
    );
    expect(classOf("revoke update, delete on orders.orders from public", created)).toBe("additive");
    expect(classOf("revoke update, delete on orders.other from public", created)).toBe("contract");
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
