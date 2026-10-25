/**
 * Stackra file contract:
 * Purpose: unit tests of `parseDecimal` and `rational`: exact reduced fractions from decimal strings and integers, and
 *          refusals of floats, exponents and a zero denominator.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseDecimal } from "#core/functions/parse-decimal.function";
import { rational } from "#core/functions/rational.function";

describe("parseDecimal", () => {
  it("reads decimals exactly", () => {
    expect(parseDecimal("2.54")).toEqual({ num: 127n, den: 50n });
    expect(parseDecimal("-0.50")).toEqual({ num: -1n, den: 2n });
    expect(parseDecimal(12)).toEqual({ num: 12n, den: 1n });
    expect(parseDecimal(7n)).toEqual({ num: 7n, den: 1n });
  });

  it.each([0.1, "1e3", "1,5", " 1", ""])("refuses %j", (value) => {
    expect(() => parseDecimal(value as string)).toThrow(RangeError);
  });
});

describe("rational", () => {
  it("moves the sign up and reduces", () => {
    expect(rational(10n, -4n)).toEqual({ num: -5n, den: 2n });
    expect(rational(0n, 5n)).toEqual({ num: 0n, den: 1n });
    expect(() => rational(1n, 0n)).toThrow(RangeError);
  });
});
