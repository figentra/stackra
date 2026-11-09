/**
 * Stackra file contract:
 * Purpose: unit tests of `base64Of` and its inverse, `@stackra/support`'s `decodeBase64`: a round trip, including
 *          bytes above 127.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { decodeBase64 } from "@stackra/support";
import { describe, expect, it } from "@stackra/testing";

import { base64Of } from "#core/functions/base64-of.function";

describe("base64Of", () => {
  it("encodes every byte value", () => {
    expect(base64Of(new TextEncoder().encode("abc"))).toBe("YWJj");
    expect(base64Of(new Uint8Array([255, 0]))).toBe("/wA=");
  });

  it("round-trips through decodeBase64", () => {
    const bytes = new Uint8Array([0, 128, 255, 7]);
    expect(decodeBase64(base64Of(bytes))).toEqual(bytes);
  });
});
