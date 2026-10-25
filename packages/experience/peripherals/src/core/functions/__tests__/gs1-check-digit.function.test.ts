/**
 * Stackra file contract:
 * Purpose: unit tests of `gs1CheckDigit`: the GS1 modulo-10 digit of known EAN-13 and UPC-A bodies.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; the COM-241 answer.
 */
import { describe, expect, it } from "@stackra/testing";

import { gs1CheckDigit } from "#core/functions/gs1-check-digit.function";

describe("gs1CheckDigit", () => {
  it("computes the check digit of EAN-13 and UPC-A bodies", () => {
    expect(gs1CheckDigit("400638133393")).toBe(1); // EAN-13 4006381333931
    expect(gs1CheckDigit("03600029145")).toBe(2); // UPC-A 036000291452
    expect(gs1CheckDigit("211234501250")).toBe(6);
  });
});
