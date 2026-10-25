/**
 * Stackra file contract:
 * Purpose: unit tests of `valueAt`: a dotted path's value, undefined for a missing one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { valueAt } from "#core/functions/value-at.function";

describe("valueAt", () => {
  it("reads a dotted path", () => {
    expect(valueAt({ totals: { totalMinor: 900 } }, "totals.totalMinor")).toBe(900);
    expect(valueAt({ totals: null }, "totals.totalMinor")).toBeUndefined();
    expect(valueAt(undefined, "id")).toBeUndefined();
  });
});
