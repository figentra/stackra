/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeQr`: a square matrix with the four-module light quiet zone, larger for more data.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeQr } from "#core/functions/encode-qr.function";

describe("encodeQr", () => {
  it("encodes a square with a light quiet zone", () => {
    const matrix = encodeQr("https://verify.example/abc", "M");
    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);
    expect(matrix[0]?.every((isDark) => !isDark)).toBe(true);
    expect(matrix[3]?.every((isDark) => !isDark)).toBe(true);
    expect(matrix[4]?.[4]).toBe(true); // the finder pattern's corner
  });

  it("grows with the data", () => {
    expect(encodeQr("x".repeat(200), "M").length).toBeGreaterThan(encodeQr("x", "M").length);
  });
});
