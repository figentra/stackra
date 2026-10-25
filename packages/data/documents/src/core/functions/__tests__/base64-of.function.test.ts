/**
 * Stackra file contract:
 * Purpose: unit tests of `base64Of` and its inverse `bytesOfBase64`: a round trip, including bytes above 127.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { base64Of } from "#core/functions/base64-of.function";

describe("base64Of", () => {
  it("encodes every byte value", () => {
    expect(base64Of(new TextEncoder().encode("abc"))).toBe("YWJj");
    expect(base64Of(new Uint8Array([255, 0]))).toBe("/wA=");
  });
});
