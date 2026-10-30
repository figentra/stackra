/**
 * Stackra file contract:
 * Purpose: proves `clockPartsOf` splits a duration and treats a negative one as zero.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { clockPartsOf } from "#core/functions/clock-parts-of.function";

describe("clockPartsOf", () => {
  it("splits a duration and floors a negative one at zero", () => {
    expect(clockPartsOf(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000 + 999)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    expect(clockPartsOf(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});
