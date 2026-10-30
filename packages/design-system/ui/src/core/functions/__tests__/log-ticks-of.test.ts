/**
 * Stackra file contract:
 * Purpose: proves `logTicksOf` spans the data in powers of ten and ignores values a log axis cannot draw.
 * Boundary: pure function; no rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
import { logTicksOf } from "#core/functions/log-ticks-of.function";

describe("logTicksOf", () => {
  it("spans the data in powers of ten", () => {
    expect(logTicksOf([12, 310, 21_400])).toEqual([10, 100, 1000, 10_000, 100_000]);
  });

  it("leaves out zero, negatives and non-numbers", () => {
    expect(logTicksOf([0, -5, null, "x", 3, 40])).toEqual([1, 10, 100]);
  });

  it("gives at least one decade, and [1, 10] with nothing to draw", () => {
    expect(logTicksOf([100])).toEqual([100, 1000]);
    expect(logTicksOf([])).toEqual([1, 10]);
  });
});
