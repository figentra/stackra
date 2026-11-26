/**
 * Stackra file contract:
 * Purpose: unit tests of `classifyMigrations`: each migration takes the highest class of its statements across its
 *          steps, `destructive` is set for contract and banned, the step files match `emitMigrations`' names, every
 *          statement above additive is a finding with its step and position, a table created earlier in the same
 *          migration keeps later steps on it additive (not one `CREATE TABLE IF NOT EXISTS` may have adopted), each
 *          statement of a multi-statement string is classed alone, and a banned statement is refused
 *          (`migration_banned`) unless the migration is a released one, such as `database.0005_create_cache_tables`.
 * Boundary: test only; pure, units built inline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3; the 2026-10-23 note); ADR 0533 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { RELEASED_BANNED_MIGRATIONS } from "#core/constants/released-banned-migrations.constant";
import { classifyMigrations } from "#core/functions/classify-migrations.function";
import { emitMigrations } from "#core/functions/emit-migrations.function";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** A unit of `id` with `steps`, each a list of statements; the second and later steps are online. */
const unit = (id: string, ...steps: (readonly string[])[]): MigrationUnit => ({
  id,
  owner: "member",
  file: `src/modules/orders/database/migrations/${id.slice(7, 11)}-x.migration.ts`,
  after: [],
  steps: steps.map((sql, index) => ({ sql, transactional: index === 0, inverse: false })),
});

const CREATE = unit(
  "orders.0001_create_orders",
  [
    'create schema if not exists "orders"',
    'create table "orders"."orders" ("id" int, "note" text)',
  ],
  ['create index "idx_orders_note" on "orders"."orders" ("note")'],
);
const INDEX = unit("orders.0002_index_note", [
  'create index concurrently "idx_orders_id" on "orders"."orders" ("id")',
]);
const DROP = unit(
  "orders.0003_drop_note",
  ['comment on table "orders"."orders" is \'orders\''],
  ['alter table "orders"."orders" drop column "note"'],
);
const BACKFILL = unit("orders.0004_backfill", ['update "orders"."orders" set "id" = 1']);

describe("classifyMigrations", () => {
  it("classes each migration by its highest statement and marks contract or banned destructive", () => {
    const { safety, errors } = classifyMigrations([CREATE, INDEX, DROP]);

    expect(errors).toEqual([]);
    expect(safety.schema).toBe("stackra.migration-safety/v1");
    expect(safety.migrations.map((row) => [row.id, row.class, row.destructive])).toEqual([
      ["orders.0001_create_orders", "additive", false],
      ["orders.0002_index_note", "online", false],
      ["orders.0003_drop_note", "contract", true],
    ]);
  });

  /** runway compares these with `.stackra/migrations`, so they are emitMigrations' names exactly. */
  it("records the step files emitMigrations writes", () => {
    const ordered = [CREATE, INDEX, DROP];
    const { safety } = classifyMigrations(ordered);

    expect(safety.migrations.flatMap((row) => row.files)).toEqual(
      emitMigrations(ordered)
        .map((file) => file.path)
        .filter((path) => path.endsWith(".up.sql"))
        .map((path) => path.slice(".stackra/migrations/".length, -".up.sql".length)),
    );
    expect(safety.migrations[0]?.files).toEqual([
      "0001_orders_0001_create_orders_1",
      "0002_orders_0001_create_orders_2",
    ]);
  });

  it("lists every statement above additive with its step and position", () => {
    const { safety } = classifyMigrations([DROP]);

    expect(safety.migrations[0]?.findings).toEqual([
      {
        step: 2,
        statement: 1,
        class: "contract",
        reason: "drops a column the running release may still read or write",
        sql: 'alter table "orders"."orders" drop column "note"',
      },
    ]);
  });

  /** The index of step 2 is on the table step 1 created, so it blocks no release's writes. */
  it("keeps a change to a table created earlier in the same migration additive", () => {
    expect(classifyMigrations([CREATE]).safety.migrations[0]?.findings).toEqual([]);
  });

  it("refuses a banned statement with migration_banned", () => {
    const { errors, safety } = classifyMigrations([CREATE, BACKFILL]);

    expect(safety.migrations[1]).toMatchObject({ class: "banned", destructive: true });
    expect(errors).toEqual([
      expect.objectContaining({
        code: "migration_banned",
        file: BACKFILL.file,
        subject: "orders.0004_backfill step 1 statement 1",
      }),
    ]);
  });

  /** A hidden drop after a harmless first statement is still seen, and named in its own finding. */
  it("classes each statement of a multi-statement string alone", () => {
    const hidden = unit("orders.0005_hidden_drop", [
      'comment on table "orders"."orders" is null; drop table "orders"."orders"',
    ]);
    const { safety, errors } = classifyMigrations([hidden]);

    expect(errors).toEqual([]);
    expect(safety.migrations[0]).toMatchObject({ class: "contract", destructive: true });
    expect(safety.migrations[0]?.findings).toEqual([
      expect.objectContaining({
        statement: 1,
        class: "contract",
        sql: 'drop table "orders"."orders"',
      }),
    ]);
    expect(
      classifyMigrations([
        unit("orders.0006_hidden_write", ["select 1; update orders.orders set a = 1"]),
      ]).errors,
    ).toEqual([expect.objectContaining({ code: "migration_banned" })]);
  });

  /** A table one statement of the string creates is new to the ones after it. */
  it("carries the tables a multi-statement string creates", () => {
    expect(
      classifyMigrations([
        unit("orders.0007_new_table", [
          "create table orders.notes (id int); create index on orders.notes (id)",
        ]),
      ]).safety.migrations[0]?.class,
    ).toBe("additive");
  });

  /** database.0005: IF NOT EXISTS adopts the cache tables a service may have made, so its plain index blocks writes. */
  it("judges an index after CREATE TABLE IF NOT EXISTS against an existing table", () => {
    const adopt = unit("database.0005_create_cache_tables", [
      'create unlogged table if not exists "cache"."entries" (key text primary key, expires_at timestamptz)',
      'create index if not exists "idx_entries_expires_at" on "cache"."entries" (expires_at)',
    ]);

    expect(classifyMigrations([adopt], new Set()).errors).toEqual([
      expect.objectContaining({
        code: "migration_banned",
        subject: "database.0005_create_cache_tables step 1 statement 2",
      }),
    ]);
    const released = classifyMigrations([adopt]);
    expect(RELEASED_BANNED_MIGRATIONS.has("database.0005_create_cache_tables")).toBe(true);
    expect(released.errors).toEqual([]);
    expect(released.safety.migrations[0]).toMatchObject({ class: "banned", destructive: true });
  });

  /** An applied migration is frozen: a released one keeps compiling, classed banned and destructive. */
  it("keeps a released banned migration, classed banned", () => {
    const { errors, safety } = classifyMigrations([BACKFILL], new Set(["orders.0004_backfill"]));

    expect(errors).toEqual([]);
    expect(safety.migrations[0]).toMatchObject({ class: "banned", destructive: true });
  });
});
