/**
 * Stackra file contract:
 * Purpose: unit tests of `exportCell`: scalars and dates pass, nothing is an empty cell, a bigint is its digits and an
 *          object is its JSON.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367.
 */
import { describe, expect, it } from "@stackra/testing";

import { exportCell } from "#node/functions/export-cell.function";

describe("exportCell", () => {
  it("keeps scalars and dates and empties nothing", () => {
    const at = new Date("2026-10-28T09:00:00Z");
    expect([exportCell("a"), exportCell(1), exportCell(false), exportCell(at)]).toEqual([
      "a",
      1,
      false,
      at,
    ]);
    expect(exportCell(null)).toBeNull();
    expect(exportCell(undefined)).toBeNull();
  });

  it("writes a bigint as digits and an object as JSON", () => {
    expect(exportCell(10n)).toBe("10");
    expect(exportCell({ amountMinor: 1250, currency: "SAR" })).toBe(
      '{"amountMinor":1250,"currency":"SAR"}',
    );
  });
});
