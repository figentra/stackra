/**
 * Stackra file contract:
 * Purpose: unit tests of `hexOf`: lower-case, two digits per byte.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { hexOf } from "#core/functions/hex-of.function";

describe("hexOf", () => {
  it("writes two lower-case digits per byte", () => {
    expect(hexOf(new Uint8Array([0, 15, 255]))).toBe("000fff");
  });
});
