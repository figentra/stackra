/**
 * Stackra file contract:
 * Purpose: proves `markToneOf`: an emphasised mark keeps its colour, and any other mark is the colour mixed into the
 *          surface at the theme's context share, so the emphasised one stands out in light and dark.
 * Boundary: pure function; no DOM.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { MARK_PAINT } from "#react/chart/mark-paint.constant";
import { markToneOf } from "#react/chart/mark-tone-of.function";

describe("markToneOf", () => {
  it("keeps an emphasised mark's colour", () => {
    expect(markToneOf("var(--chart-1)", true)).toBe("var(--chart-1)");
  });

  it("mixes a context mark into the surface at the context share", () => {
    expect(markToneOf("var(--chart-1)", false)).toBe(
      `color-mix(in oklab, var(--chart-1) ${MARK_PAINT.contextShare}%, var(--surface))`,
    );
  });
});
