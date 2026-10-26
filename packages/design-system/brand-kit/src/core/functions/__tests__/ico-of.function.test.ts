/**
 * Stackra file contract:
 * Purpose: unit tests of `icoOf`: the header counts the images, each directory entry holds its size, byte length and
 *          offset, the PNG bytes follow unchanged, 256 is written as 0, and an oversized image is refused.
 * Boundary: test only; pure bytes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { icoOf } from "#core/functions/ico-of.function";

describe("icoOf", () => {
  it("packs the images behind their directory", () => {
    const ico = icoOf([
      { size: 16, png: new Uint8Array([1, 2, 3]) },
      { size: 256, png: new Uint8Array([4]) },
    ]);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(2);
    expect(ico[6]).toBe(16);
    expect(view.getUint32(14, true)).toBe(3);
    expect(view.getUint32(18, true)).toBe(38);
    expect(ico[22]).toBe(0);
    expect(view.getUint32(34, true)).toBe(41);
    expect(Array.from(ico.subarray(38))).toEqual([1, 2, 3, 4]);
  });

  it("refuses an image over 256 pixels", () => {
    expect(() => icoOf([{ size: 512, png: new Uint8Array() }])).toThrow(RangeError);
  });
});
