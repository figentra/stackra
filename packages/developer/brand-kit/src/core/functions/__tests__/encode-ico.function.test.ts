/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeIco`: the ICONDIR header, one entry per PNG with its size, length and offset, the PNG
 *          bytes copied after the directory, 256 written as 0, and out-of-range sizes refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeIco } from "#core/functions/encode-ico.function";

describe("encodeIco", () => {
  it("frames the PNGs behind an icon directory", () => {
    const ico = encodeIco([
      { size: 16, png: new Uint8Array([1, 2]) },
      { size: 256, png: new Uint8Array([3]) },
    ]);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(2);
    expect(ico[6]).toBe(16);
    expect(view.getUint32(6 + 8, true)).toBe(2);
    expect(view.getUint32(6 + 12, true)).toBe(38);
    expect(ico[22]).toBe(0);
    expect(view.getUint32(22 + 12, true)).toBe(40);
    expect(Array.from(ico.slice(38))).toEqual([1, 2, 3]);
  });

  it("refuses a size outside 1 to 256", () => {
    expect(() => encodeIco([{ size: 300, png: new Uint8Array() }])).toThrow(RangeError);
  });
});
