/**
 * Stackra file contract:
 * Purpose: proves paintedColour resolves a name as web.css over HeroUI paints it: a palette entry before a role, a
 *          role by its hex, HeroUI's color-mix derivation with its alpha (a soft fill is the status colour at 15% in
 *          light), transparent as clear, and nothing for a name nobody paints.
 * Boundary: in-memory themes only.
 * Runtime: node
 * Governing contract: ADR 0340 (decision 4); ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { paintedColour } from "#core/functions/painted-colour.function";

const channels = (hex: string) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));

describe("paintedColour", () => {
  it("paints a role by its hex, opaque", () => {
    const accent = paintedColour(STACKRA_THEME, "accent", "light");
    expect(accent?.rgb).toEqual(channels(STACKRA_THEME.colors.accent.hexLight));
    expect(accent?.alpha).toBe(1);
  });

  it("paints the theme's own palette entry over HeroUI's derivation of the same name", () => {
    const hover = paintedColour(STACKRA_THEME, "warning-hover", "light");
    expect(hover?.rgb).toEqual(channels(STACKRA_THEME.palette["warning-hover"]?.hexLight ?? ""));
  });

  it("derives a soft fill as the status colour at its share, translucent", () => {
    const soft = paintedColour(STACKRA_THEME, "warning-soft", "light");
    expect(soft?.alpha).toBeCloseTo(0.15, 6);
    expect(soft?.rgb.map(Math.round)).toEqual(channels(STACKRA_THEME.colors.warning.hexLight));
  });

  it("paints transparent as clear, and nothing for an unknown name", () => {
    expect(paintedColour(STACKRA_THEME, "transparent", "dark")).toEqual({
      rgb: [0, 0, 0],
      alpha: 0,
    });
    expect(paintedColour(STACKRA_THEME, "no-such-colour", "dark")).toBeUndefined();
  });
});
