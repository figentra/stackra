/**
 * Stackra file contract:
 * Purpose: unit tests of `classifyMigrations`: each migration takes the highest class of its statements across its
 *          steps, `destructive` is set for contract and banned, the step files match `emitMigrations`' names, every
 *          statement above additive is a finding with its step and position, a table created earlier in the same
 *          migration keeps later steps on it additive, and a banned statement is refused (`migration_banned`) unless
 *          the migration is a released one.
 * Boundary: test only; pure, units built inline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3; the 2026-10-23 note); ADR 0533 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

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

  /** An applied migration is frozen: a released one keeps compiling, classed banned and destructive. */
  it("keeps a released banned migration, classed banned", () => {
    const { errors, safety } = classifyMigrations([BACKFILL], new Set(["orders.0004_backfill"]));

    expect(errors).toEqual([]);
    expect(safety.migrations[0]).toMatchObject({ class: "banned", destructive: true });
  });
});
