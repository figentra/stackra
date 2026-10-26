/**
 * Stackra file contract:
 * Purpose: unit tests of `normalizeAwardCode`: case, spaces, hyphens and look-alikes fold to the canonical code, and a
 *          wrong length or a character outside the alphabet is null.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0432 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { normalizeAwardCode } from "#core/functions/normalize-award-code.function";

describe(normalizeAwardCode, () => {
  it("folds what a person types to the canonical code", () => {
    expect(normalizeAwardCode("7k3q-9xpm-0abz")).toBe("7K3Q9XPM0ABZ");
    expect(normalizeAwardCode(" 7K3Q 9XPM OABZ ")).toBe("7K3Q9XPM0ABZ");
    expect(normalizeAwardCode("lIIL-0000-0000")).toBe("111100000000");
  });

  it("refuses anything else", () => {
    expect(normalizeAwardCode("7K3Q-9XPM")).toBeNull();
    expect(normalizeAwardCode("7K3Q-9XPM-0ABU")).toBeNull();
    expect(normalizeAwardCode("")).toBeNull();
  });
});
