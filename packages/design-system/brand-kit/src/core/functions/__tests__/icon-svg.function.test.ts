/**
 * Stackra file contract:
 * Purpose: unit tests of `iconSvg`: the symbol is centred at its share of the 1024-unit canvas and coloured through
 *          `currentColor`; a tile appears only with a background, rounded by the radius share.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { iconSvg } from "#core/functions/icon-svg.function";

const SYMBOL = {
  viewBox: [0, 0, 24, 24] as const,
  body: '<path fill="currentColor" d="M0 0h24v24H0z"/>',
};

describe("iconSvg", () => {
  it("centres the symbol on a rounded tile", () => {
    const svg = iconSvg(SYMBOL, {
      color: "#FFFFFF",
      background: "#112233",
      scale: 0.5,
      radius: 0.25,
    });
    expect(svg).toContain('<rect width="1024" height="1024" rx="256" fill="#112233"/>');
    expect(svg).toContain(
      '<svg x="256" y="256" width="512" height="512" viewBox="0 0 24 24" color="#FFFFFF"',
    );
  });

  it("draws no tile without a background", () => {
    expect(iconSvg(SYMBOL, { color: "#000000", scale: 1 })).not.toContain("<rect");
  });
});
