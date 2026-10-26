/**
 * Stackra file contract:
 * Purpose: unit tests of `pngSize`: the width and height come from the IHDR chunk; bytes that are not a PNG are
 *          refused.
 * Boundary: test only; pure bytes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { pngSize } from "#core/functions/png-size.function";

describe("pngSize", () => {
  it("reads the header", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(png.buffer);
    view.setUint32(16, 1290);
    view.setUint32(20, 2796);
    expect(pngSize(png)).toEqual({ width: 1290, height: 2796 });
  });

  it("refuses other bytes", () => {
    expect(() => pngSize(new Uint8Array(24))).toThrow(TypeError);
  });
});
