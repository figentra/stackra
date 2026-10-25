/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeQrPng`: a valid PNG signature and header of the scaled size.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeQrPng } from "#core/functions/encode-qr-png.function";

describe("encodeQrPng", () => {
  it("writes a greyscale PNG of side modules times scale", async () => {
    const png = await encodeQrPng(
      [
        [true, false],
        [false, true],
      ],
      3,
    );
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const view = new DataView(png.buffer, png.byteOffset);
    expect(new TextDecoder().decode(png.subarray(12, 16))).toBe("IHDR");
    expect(view.getUint32(16)).toBe(6);
    expect(view.getUint32(20)).toBe(6);
    expect(png[24]).toBe(8);
    expect(new TextDecoder().decode(png.subarray(png.length - 8, png.length - 4))).toBe("IEND");
  });
});
