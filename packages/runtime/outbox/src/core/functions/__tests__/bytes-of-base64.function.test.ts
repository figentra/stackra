/**
 * Stackra file contract:
 * Purpose: unit tests of `bytesOfBase64`: Base64 and base64url, with or without padding, decode to the same bytes;
 *          text that is not Base64 is `undefined`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; RFC 4648.
 */
import { describe, expect, it } from "@stackra/testing";

import { bytesOfBase64 } from "#core/functions/bytes-of-base64.function";

describe(bytesOfBase64, () => {
  it("decodes Base64 and base64url, padded or not", () => {
    const bytes = [251, 255, 191];
    expect([...(bytesOfBase64("+/+/") ?? [])]).toEqual(bytes);
    expect([...(bytesOfBase64("-_-_") ?? [])]).toEqual(bytes);
    expect([...(bytesOfBase64("AQ==") ?? [])]).toEqual([1]);
    expect([...(bytesOfBase64("AQ") ?? [])]).toEqual([1]);
  });

  it("is undefined for text that is not Base64", () => {
    expect(bytesOfBase64("not base64")).toBeUndefined();
    expect(bytesOfBase64("A")).toBeUndefined();
  });
});
