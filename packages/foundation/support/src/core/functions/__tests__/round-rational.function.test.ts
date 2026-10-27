/**
 * Stackra file contract:
 * Purpose: unit tests of the internal `roundRational`: each mode on positive and negative halves and non-halves.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-934.
 */
import { describe, expect, it } from "@stackra/testing";

import { roundRational } from "#core/functions/round-rational.function";

const r = (num: bigint, den: bigint) => ({ num, den });

describe("roundRational", () => {
  it("rounds half away from zero", () => {
    expect(roundRational(r(5n, 2n), "half_up")).toBe(3n);
    expect(roundRational(r(-5n, 2n), "half_up")).toBe(-3n);
    expect(roundRational(r(7n, 5n), "half_up")).toBe(1n);
  });

  it("rounds down toward zero and up away from zero", () => {
    expect(roundRational(r(19n, 10n), "down")).toBe(1n);
    expect(roundRational(r(-19n, 10n), "down")).toBe(-1n);
    expect(roundRational(r(11n, 10n), "up")).toBe(2n);
    expect(roundRational(r(-11n, 10n), "up")).toBe(-2n);
    expect(roundRational(r(4n, 1n), "up")).toBe(4n);
  });

  it("refuses an unknown mode", () => {
    expect(() => roundRational(r(1n, 2n), "even" as never)).toThrow(RangeError);
  });
});
