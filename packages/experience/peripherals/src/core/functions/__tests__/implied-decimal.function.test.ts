/**
 * Stackra file contract:
 * Purpose: unit tests of `impliedDecimal`: whole-number zeros go, the fraction keeps every digit, and a value shorter
 *          than its decimals is padded.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-965.
 */
import { describe, expect, it } from "@stackra/testing";

import { impliedDecimal } from "#core/functions/implied-decimal.function";

describe("impliedDecimal", () => {
  it("places the implied decimals", () => {
    expect(impliedDecimal("001250", 3)).toBe("1.250");
    expect(impliedDecimal("0899", 0)).toBe("899");
    expect(impliedDecimal("0000", 0)).toBe("0");
    expect(impliedDecimal("050", 3)).toBe("0.050");
    expect(impliedDecimal("5", 2)).toBe("0.05");
  });
});
