/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeEan13`: the check digit is added or checked, the symbol is 95 modules with its quiet
 *          zones and guards, the parity follows the first digit, and anything that is not 12 or 13 digits is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0365 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeEan13 } from "#core/functions/encode-ean13.function";

/** The modules as a 0/1 string. */
function bitsOf(modules: readonly boolean[]): string {
  return modules.map((module) => (module ? "1" : "0")).join("");
}

describe("encodeEan13", () => {
  it("adds the check digit to twelve digits", () => {
    expect(encodeEan13("400638133393")?.text).toBe("4006381333931");
  });

  it("accepts thirteen digits with the right check digit and refuses a wrong one", () => {
    expect(encodeEan13("4006381333931")?.text).toBe("4006381333931");
    expect(encodeEan13("4006381333932")).toBeUndefined();
  });

  it("refuses anything that is not 12 or 13 digits", () => {
    expect(encodeEan13("12345")).toBeUndefined();
    expect(encodeEan13("40063813339a")).toBeUndefined();
    expect(encodeEan13("")).toBeUndefined();
  });

  it("lays out quiet zones, guards and 95 modules", () => {
    const bits = bitsOf(encodeEan13("4006381333931")?.modules ?? []);
    expect(bits).toHaveLength(11 + 95 + 7);
    expect(bits.slice(0, 11)).toBe("0".repeat(11));
    expect(bits.slice(11, 14)).toBe("101");
    expect(bits.slice(14 + 42, 14 + 47)).toBe("01010");
    expect(bits.slice(14 + 89, 14 + 92)).toBe("101");
    expect(bits.slice(-7)).toBe("0".repeat(7));
  });

  it("encodes a known symbol: first digit 0 is all L, right side R", () => {
    // 0 0 0 0 0 0 0 0 0 0 0 0 → check 0; every left digit L(0), every right digit R(0).
    const bits = bitsOf(encodeEan13("000000000000")?.modules ?? []);
    expect(bits.slice(14, 14 + 42)).toBe("0001101".repeat(6));
    expect(bits.slice(14 + 47, 14 + 89)).toBe("1110010".repeat(6));
  });

  it("uses G codes where the first digit's parity says so", () => {
    // First digit 1 → LLGLGG; the third left digit (0) is G(0) = 0100111.
    const bits = bitsOf(encodeEan13("100000000000")?.modules ?? []);
    expect(bits.slice(14 + 14, 14 + 21)).toBe("0100111");
  });
});
