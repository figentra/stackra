/**
 * Stackra file contract:
 * Purpose: unit tests of `restrictedGtin`: a padded serial under a restricted prefix with its GS1 check digit, and the
 *          refusal of an unrestricted prefix and of a serial that does not fit.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; GS1 General Specifications; MUS-34.
 */
import { describe, expect, it } from "@stackra/testing";

import { restrictedGtin } from "#core/functions/restricted-gtin.function";

describe("restrictedGtin", () => {
  it("pads the serial and appends the check digit", () => {
    expect(restrictedGtin("20", 1)).toBe("2000000000015");
    expect(restrictedGtin("0412", 98765n)).toHaveLength(13);
  });

  it.each(["62", "1", "301", "2a"])("refuses prefix %s", (prefix) => {
    expect(() => restrictedGtin(prefix, 1)).toThrow(RangeError);
  });

  it("refuses a serial that does not fit or is negative", () => {
    expect(() => restrictedGtin("29", 10_000_000_000)).toThrow(RangeError);
    expect(() => restrictedGtin("29", -1)).toThrow(RangeError);
  });
});
