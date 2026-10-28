/**
 * Stackra file contract:
 * Purpose: unit tests of `formatDecimal`: the shortest exact string, leading zeros padded, trailing fraction zeros
 *          dropped, the sign kept and never a negative zero.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0220 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { formatDecimal } from "#core/functions/format-decimal.function";

describe("formatDecimal", () => {
  it("prints the shortest exact decimal", () => {
    expect(formatDecimal({ digits: 1250n, scale: 2 })).toBe("12.5");
    expect(formatDecimal({ digits: 109_375n, scale: 4 })).toBe("10.9375");
    expect(formatDecimal({ digits: 7n, scale: 0 })).toBe("7");
    expect(formatDecimal({ digits: -5n, scale: 3 })).toBe("-0.005");
    expect(formatDecimal({ digits: 0n, scale: 4 })).toBe("0");
    expect(formatDecimal({ digits: 1200n, scale: 2 })).toBe("12");
  });
});
