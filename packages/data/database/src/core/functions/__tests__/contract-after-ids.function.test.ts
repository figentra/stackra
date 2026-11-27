/**
 * Stackra file contract:
 * Purpose: unit tests of `contractAfterIds`: it reads the ids a compiled file's release gates wait for from their marker
 *          lines, once each in file order, and ignores a file with no contract step and a marker that names no
 *          migration id (STA-1406).
 * Boundary: test only; pure text.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { contractAfterIds } from "#core/functions/contract-after-ids.function";
import { releaseGateSql } from "#core/functions/release-gate-sql.function";

describe("contractAfterIds", () => {
  it("reads the migration each release gate of a file waits for, once, in order", () => {
    const sql = [
      releaseGateSql("orders.0007_stop_writing_note", "orders.orders drop column note"),
      "alter table orders.orders drop column note",
      releaseGateSql("orders.0003_copy_memo", "orders.orders finish rename memo to remark"),
      releaseGateSql("orders.0007_stop_writing_note", "orders.orders drop column flag"),
    ].join(";\n");
    expect(contractAfterIds(sql)).toEqual([
      "orders.0007_stop_writing_note",
      "orders.0003_copy_memo",
    ]);
  });

  it("finds none in a file without a contract step, or behind a marker that names no migration id", () => {
    expect(contractAfterIds("alter table orders.orders add column note text")).toEqual([]);
    expect(
      contractAfterIds(
        "-- stackra:contract-after=Orders.7\n-- stackra:contract-after=orders.0001_x y",
      ),
    ).toEqual([]);
  });
});
