/**
 * Stackra file contract:
 * Purpose: unit tests of `currentRows`: a corrected row drops out, a chain resolves to its last correction, untouched
 *          rows stay, and the order is kept.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0321 (2026-10-24 amendment).
 */
import { describe, expect, it } from "@stackra/testing";

import { currentRows } from "#core/functions/current-rows.function";

describe(currentRows, () => {
  it("keeps the latest correction of each chain and every uncorrected row", () => {
    const rows = [
      { id: "a", corrects: null },
      { id: "b", corrects: null },
      { id: "c", corrects: "a" },
      { id: "d", corrects: "c" },
    ];
    expect(currentRows(rows).map((row) => row.id)).toEqual(["b", "d"]);
    expect(currentRows([])).toEqual([]);
  });
});
