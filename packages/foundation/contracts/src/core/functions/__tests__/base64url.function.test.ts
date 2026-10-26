/**
 * Stackra file contract:
 * Purpose: unit tests of `base64urlEncode` and `base64urlDecode`: the URL-safe alphabet without padding, padded and
 *          plain base64 read back, and every byte value round-tripping.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; RFC 4648 section 5.
 */
import { describe, expect, it } from "@stackra/testing";

import { base64urlDecode } from "#core/functions/base64url-decode.function";
import { base64urlEncode } from "#core/functions/base64url-encode.function";

describe("base64url", () => {
  it("writes the URL-safe alphabet without padding", () => {
    expect(base64urlEncode(new Uint8Array([251, 255]))).toBe("-_8");
    expect(base64urlEncode(new Uint8Array([]))).toBe("");
  });

  it("reads unpadded, padded and plain base64", () => {
    expect([...base64urlDecode("-_8")]).toEqual([251, 255]);
    expect([...base64urlDecode("+/8=")]).toEqual([251, 255]);
  });

  it("round-trips every byte value", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, index) => index);
    expect([...base64urlDecode(base64urlEncode(bytes))]).toEqual([...bytes]);
  });
});
