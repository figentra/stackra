/**
 * Stackra file contract:
 * Purpose: unit tests of `releaseGateSql` and `contractAfterFilePattern`: the gate opens with the marker naming the
 *          migration it waits for, matches that migration's step files and no other, reads the finished release runs,
 *          keeps no blank line, and refuses an `after` that is not a migration id (STA-1406).
 * Boundary: test only; the gate's behaviour on Postgres is covered by the blueprint and schema record tests and the
 *           runner's integration test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { contractAfterFilePattern } from "#core/functions/contract-after-file-pattern.function";
import { releaseGateSql } from "#core/functions/release-gate-sql.function";

describe("releaseGateSql", () => {
  const gate = releaseGateSql("orders.0007_stop_writing_note", "orders.orders drop column note");

  it("names the migration it waits for on the line after `do $$`, and keeps no blank line", () => {
    expect(gate.split("\n").slice(0, 2)).toEqual([
      "do $$",
      "-- stackra:contract-after=orders.0007_stop_writing_note",
    ]);
    expect(gate).not.toMatch(/\n\s*\n/);
  });

  it("passes only past a finished run of another release that holds the migration", () => {
    expect(gate).toContain(
      "perform 1 from schema_migrations_releases where release_id <> this_release and through_version >= after_version and finished_at >= after_applied;",
    );
    expect(gate).toContain("no migrate run of a release holding it has finished since");
  });

  it("refuses an `after` that is not a migration id", () => {
    expect(() => releaseGateSql("orders.7", "orders.orders drop column note")).toThrow(TypeError);
  });
});

describe("contractAfterFilePattern", () => {
  it("matches the step files of the migration and no other", () => {
    const pattern = new RegExp(contractAfterFilePattern("orders.0007_stop_writing_note"));
    expect(pattern.test("0012_orders_0007_stop_writing_note")).toBe(true);
    expect(pattern.test("0012_orders_0007_stop_writing_note_2")).toBe(true);
    expect(pattern.test("0012_orders_0007_stop_writing_notes")).toBe(false);
    expect(pattern.test("0012_shop_orders_0007_stop_writing_note")).toBe(false);
  });
});
