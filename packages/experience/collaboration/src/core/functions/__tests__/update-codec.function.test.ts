/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeUpdate` and `decodeUpdate`: bytes round-trip through base64 text, and anything that is
 *          not base64 text decodes to `undefined`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { decodeUpdate } from "#core/functions/decode-update.function";
import { encodeUpdate } from "#core/functions/encode-update.function";

describe("encodeUpdate and decodeUpdate", () => {
  it("round-trip an update", () => {
    const update = new Uint8Array([0, 1, 255, 128]);
    expect(encodeUpdate(new Uint8Array([0, 1]))).toBe("AAE=");
    expect(decodeUpdate(encodeUpdate(update))).toEqual(update);
  });

  it("drop what is not base64 text", () => {
    expect(decodeUpdate(42)).toBeUndefined();
    expect(decodeUpdate("%%%")).toBeUndefined();
  });
});
