/**
 * Stackra file contract:
 * Purpose: unit tests of `bytesOfBase64`: the inverse of `base64Of`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { base64Of } from "#core/functions/base64-of.function";
import { bytesOfBase64 } from "#core/functions/bytes-of-base64.function";

describe("bytesOfBase64", () => {
  it("decodes what base64Of wrote", () => {
    const bytes = new Uint8Array([0, 128, 255, 7]);
    expect(bytesOfBase64(base64Of(bytes))).toEqual(bytes);
  });
});
