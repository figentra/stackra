/**
 * Stackra file contract:
 * Purpose: unit tests of `detectDelimiter`: the most frequent candidate outside quotes, comma on a tie or none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { detectDelimiter } from "#core/functions/detect-delimiter.function";

describe("detectDelimiter", () => {
  it("picks the most frequent candidate", () => {
    expect(detectDelimiter("a;b;c")).toBe(";");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
    expect(detectDelimiter("a|b|c,d")).toBe("|");
  });

  it("ignores candidates inside quotes", () => {
    expect(detectDelimiter('"a,b,c";d;e')).toBe(";");
  });

  it("falls back to the comma", () => {
    expect(detectDelimiter("name")).toBe(",");
    expect(detectDelimiter("a,b;c")).toBe(",");
  });
});
