/**
 * Stackra file contract:
 * Purpose: unit tests of `zplRaster`: a packed image becomes a `^GFA` field with its byte counts and hex rows and
 *          `^PQ` copies, and a size mismatch or bad copies are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { zplRaster } from "#core/functions/zpl-raster.function";

describe("zplRaster", () => {
  it("encodes the rows as a graphic field", () => {
    expect(zplRaster({ width: 8, height: 1, data: Uint8Array.of(0xff) }, 1)).toBe(
      "^XA^FO0,0^GFA,1,1,1,FF^FS^PQ1^XZ",
    );
    expect(
      zplRaster({ width: 10, height: 2, data: Uint8Array.of(0x0a, 0xc0, 0x00, 0x40) }, 3),
    ).toBe("^XA^FO0,0^GFA,4,4,2,0AC00040^FS^PQ3^XZ");
  });

  it("refuses a size mismatch and bad copies", () => {
    expect(() => zplRaster({ width: 9, height: 1, data: Uint8Array.of(1) }, 1)).toThrow(RangeError);
    expect(() => zplRaster({ width: 0, height: 1, data: new Uint8Array(0) }, 1)).toThrow(
      RangeError,
    );
    expect(() => zplRaster({ width: 8, height: 1, data: Uint8Array.of(1) }, 0)).toThrow(RangeError);
  });
});
