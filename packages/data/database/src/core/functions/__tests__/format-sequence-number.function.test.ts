/**
 * Stackra file contract:
 * Purpose: unit tests of `formatSequenceNumber`: `{n}`, `{n:06}` and `{year}` are written, a number wider than its
 *          padding is kept whole, and an unknown token, a missing year or a number below 1 is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decision 1); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { formatSequenceNumber } from "#core/functions/format-sequence-number.function";

describe(formatSequenceNumber, () => {
  it("writes the number, its padding and the year", () => {
    expect(formatSequenceNumber("INV-{year}-{n:06}", 42, 2026)).toBe("INV-2026-000042");
    expect(formatSequenceNumber("{n}", 7)).toBe("7");
    expect(formatSequenceNumber("R{n:03}", 12_345)).toBe("R12345");
  });

  it("refuses an unknown token, a missing year and a number below 1", () => {
    expect(() => formatSequenceNumber("INV-{month}-{n}", 1, 2026)).toThrow(
      /not a sequence format token/,
    );
    expect(() => formatSequenceNumber("INV-{year}-{n}", 1)).toThrow(/needs the year/);
    expect(() => formatSequenceNumber("{n}", 0)).toThrow(RangeError);
    expect(() => formatSequenceNumber("{n}", 1.5)).toThrow(RangeError);
  });
});
