/**
 * Stackra file contract:
 * Purpose: unit tests of `base64url`: the same text as `node:buffer`'s base64url for every tail length, a round
 *          trip, an ArrayBuffer input, padded input, and refusal of foreign characters.
 * Boundary: test only; the expected text comes from `node:buffer`, independently of the subject.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; RFC 4648; stackra-224 (public, notifications cases).
 */
import { Buffer } from "node:buffer";

import { describe, expect, it } from "@stackra/testing";

import { base64url } from "#core/constants/base64url.constant";

describe("base64url", () => {
  it("matches node:buffer and round-trips", () => {
    for (let length = 0; length < 40; length++) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 37 + 250) % 256);
      const text = base64url.encode(bytes);
      expect(text).toBe(Buffer.from(bytes).toString("base64url"));
      expect(base64url.decode(text)).toEqual(bytes);
    }
  });

  it("encodes an ArrayBuffer and decodes padded text", () => {
    expect(base64url.encode(new Uint8Array([251, 255]).buffer)).toBe("-_8");
    expect([...base64url.decode("-_8=")]).toEqual([251, 255]);
    expect([...base64url.decode("YQ==")]).toEqual([97]);
  });

  it("refuses characters outside the alphabet", () => {
    expect(() => base64url.decode("ab+/")).toThrow(RangeError);
    expect(() => base64url.decode("abcde")).toThrow(RangeError);
  });
});
