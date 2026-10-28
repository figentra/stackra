/**
 * Stackra file contract:
 * Purpose: unit tests of `orderMigrations`: number order inside a module, `after` ids across members, packages first
 *          on a tie, and the `migration_after_unknown`, `migration_id_duplicate` and `migration_cycle` refusals.
 * Boundary: test only; units are built inline.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { orderMigrations } from "#core/functions/order-migrations.function";
import type { MigrationUnit } from "#core/types/migration-unit.type";

/** A one-step unit. */
const unit = (
  id: string,
  owner: MigrationUnit["owner"],
  after: readonly string[] = [],
): MigrationUnit => ({
  id,
  owner,
  file: `${id}.migration.ts`,
  after,
  steps: [{ sql: [`select '${id}'`], transactional: true, inverse: [] }],
});

describe("orderMigrations", () => {
  it("keeps number order in a module and puts package migrations first on a tie", () => {
    const { ordered, errors } = orderMigrations([
      unit("billing.0002_add_totals", "member"),
      unit("billing.0001_create_invoices", "member"),
      unit("search.0001_create_text_functions", "package"),
    ]);
    expect(errors).toEqual([]);
    expect(ordered.map((entry) => entry.id)).toEqual([
      "search.0001_create_text_functions",
      "billing.0001_create_invoices",
      "billing.0002_add_totals",
    ]);
  });

  it("runs an after id first, even a member's before a package's", () => {
    const { ordered } = orderMigrations([
      unit("search.0001_create_text_functions", "package", ["billing.0001_create_invoices"]),
      unit("billing.0001_create_invoices", "member"),
    ]);
    expect(ordered.map((entry) => entry.id)).toEqual([
      "billing.0001_create_invoices",
      "search.0001_create_text_functions",
    ]);
  });

  it("refuses an after id no loaded migration has", () => {
    const { ordered, errors } = orderMigrations([
      unit("billing.0001_create_invoices", "member", ["search.0009_missing"]),
    ]);
    expect(ordered).toEqual([]);
    expect(errors.map((error) => error.code)).toEqual(["migration_after_unknown"]);
  });

  it("refuses an id loaded twice", () => {
    const { errors } = orderMigrations([
      unit("search.0001_create_text_functions", "package"),
      unit("search.0001_create_text_functions", "member"),
    ]);
    expect(errors.map((error) => error.code)).toEqual(["migration_id_duplicate"]);
  });

  it("refuses a cycle", () => {
    const { ordered, errors } = orderMigrations([
      unit("a.0001_x", "member", ["b.0001_y"]),
      unit("b.0001_y", "member", ["a.0001_x"]),
    ]);
    expect(ordered).toEqual([]);
    expect(errors.map((error) => error.code)).toEqual(["migration_cycle", "migration_cycle"]);
  });
});
