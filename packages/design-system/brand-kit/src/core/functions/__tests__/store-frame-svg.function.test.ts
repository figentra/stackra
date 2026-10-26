/**
 * Stackra file contract:
 * Purpose: unit tests of `storeFrameSvg`: the frame fills its size, the screen is fitted below the caption band with
 *          its aspect kept, and a caption wider than nine tenths of the frame is shrunk to fit.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { storeFrameSvg } from "#core/functions/store-frame-svg.function";

const SCREEN = { href: "data:image/png;base64,AA==", width: 100, height: 200 };

describe("storeFrameSvg", () => {
  it("fits the screen below the band", () => {
    const svg = storeFrameSvg({
      width: 1000,
      height: 2000,
      background: "#000000",
      foreground: "#FFFFFF",
      screen: SCREEN,
    });
    expect(svg).toContain('<rect width="1000" height="2000" fill="#000000"/>');
    // room: 840 wide, 2000 - 400 - 80 = 1520 high; the screen is 1:2, so 760 x 1520, centred
    expect(svg).toContain('x="120" y="400" width="760" height="1520"');
    expect(svg).not.toContain("<path");
  });

  it("shrinks a wide caption to fit", () => {
    const svg = storeFrameSvg({
      width: 1000,
      height: 2000,
      background: "#000000",
      foreground: "#FFFFFF",
      caption: { d: "M0 0", box: { x1: 0, y1: -100, x2: 1800, y2: 0 }, advance: 1800 },
      screen: SCREEN,
    });
    expect(svg).toContain('transform="translate(50 225) scale(0.5)"');
  });
});
