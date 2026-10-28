/**
 * Stackra file contract:
 * Purpose: unit tests of `code128`: code set B text with its modulo 103 check, code set C digit pairs, a switch
 *          between sets, GS1-128 with FNC1 at the start and for the group separator, and refusals.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ISO/IEC 15417.
 */
import { describe, expect, it } from "@stackra/testing";

import { CODE128_PATTERNS } from "#core/constants/code128-patterns.constant";
import { code128 } from "#core/functions/code128.function";

const modules = (pattern: string) => [...pattern].reduce((sum, digit) => sum + Number(digit), 0);

describe("code128", () => {
  it("encodes text in code set B with its check value", () => {
    const symbol = code128("Wikipedia");
    expect(symbol.values).toEqual([104, 55, 73, 75, 73, 80, 69, 68, 73, 65, 88, 106]);
    expect(symbol.widths.startsWith("211214")).toBe(true);
    expect(symbol.widths.endsWith("2331112")).toBe(true);
  });

  it("packs digit runs in code set C", () => {
    expect(code128("123456").values.slice(0, 4)).toEqual([105, 12, 34, 56]);
    expect(code128("AB1234").values.slice(0, 6)).toEqual([104, 33, 34, 99, 12, 34]);
  });

  it("writes GS1-128 with FNC1", () => {
    const symbol = code128("0109501101530003\u001d10AB", { gs1: true });
    expect(symbol.values.slice(0, -2)).toEqual([
      105, 102, 1, 9, 50, 11, 1, 53, 0, 3, 102, 10, 100, 33, 34,
    ]);
  });

  it("refuses empty data and non-printable characters", () => {
    expect(() => code128("")).toThrow(RangeError);
    expect(() => code128("a\u001db")).toThrow(RangeError);
  });

  it("has an 11-module pattern for every value and a 13-module stop", () => {
    expect(CODE128_PATTERNS).toHaveLength(107);
    expect(CODE128_PATTERNS.slice(0, 106).every((pattern) => modules(pattern) === 11)).toBe(true);
    expect(modules(CODE128_PATTERNS[106] ?? "")).toBe(13);
  });
});
