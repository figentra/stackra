/**
 * Stackra file contract:
 * Purpose: unit tests of `releaseGateSql` and `contractAfterFilePattern`: the gate opens with the marker naming the
 *          migration it waits for, matches that migration's step files and no other, reads the run of another release
 *          that finished last, names both ways to set a release, keeps no blank line, and refuses an `after` that is not a migration id (STA-1406).
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

  it("passes only when the run of another release that finished last holds the migration", () => {
    expect(gate).toContain(
      "select release_id, through_version, finished_at into last_release, last_through, last_finished from schema_migrations_releases where release_id <> this_release order by finished_at desc, through_version desc limit 1;",
    );
    expect(gate).toContain(
      "if found and last_through >= after_version and last_finished >= after_applied then",
    );
    expect(gate).toContain(
      "the last migrate run of another release to finish (%) does not hold it",
    );
  });

  it("names --release and STACKRA_RELEASE when the run names no release", () => {
    expect(gate).toContain(
      "pass --release <version or commit> to stackra db migrate, or set STACKRA_RELEASE=<version or commit> in the release step",
    );
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
