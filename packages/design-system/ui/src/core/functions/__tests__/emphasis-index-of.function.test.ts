/**
 * Stackra file contract:
 * Purpose: proves `emphasisIndexOf` picks the last mark for `latest`, a given index, the pointed mark over either,
 *          and none for `none` or an index outside the marks.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { emphasisIndexOf } from "#core/functions/emphasis-index-of.function";

describe("emphasisIndexOf", () => {
  it("picks the last mark for latest and the named one for an index", () => {
    expect(emphasisIndexOf("latest", 6)).toBe(5);
    expect(emphasisIndexOf(2, 6)).toBe(2);
  });

  it("lets the pointed mark win", () => {
    expect(emphasisIndexOf("latest", 6, 1)).toBe(1);
    expect(emphasisIndexOf("latest", 6, -1)).toBe(5);
  });

  it("draws every mark alike for none or an index outside the marks", () => {
    expect(emphasisIndexOf("none", 6, 1)).toBeNull();
    expect(emphasisIndexOf(9, 6)).toBeNull();
    expect(emphasisIndexOf("latest", 0)).toBeNull();
  });
});
