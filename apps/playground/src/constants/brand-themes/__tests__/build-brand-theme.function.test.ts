/**
 * Stackra file contract:
 * Purpose: proves every vendored brand layer builds into a usable theme that renders as web CSS, and that the
 *          builder derives the accent's palette steps the layer leaves out and keeps the ones it sets, and that the
 *          inspired-by presets pass every contrast pair.
 * Boundary: pure; no DOM.
 * Runtime: browser
 * Governing contract: ADR 0340; ADR 0022 (test placement).
 */
import { checkTheme, renderWebCss, STACKRA_THEME } from "@stackra/tokens";

import { BRAND_THEMES, buildBrandTheme } from "#src/constants/brand-themes";

describe("buildBrandTheme", () => {
  it.each(BRAND_THEMES.map((brand) => [brand.id, brand] as const))("builds %s", (_, brand) => {
    const theme = buildBrandTheme(brand.layer);
    expect(renderWebCss(theme)).toContain("--accent");
  });

  it("derives the accent's palette from the layer, not the base's steel", () => {
    const figentra = BRAND_THEMES.find(({ id }) => id === "figentra");
    const theme = buildBrandTheme(figentra?.layer);
    expect(theme.palette).not.toEqual(STACKRA_THEME.palette);
  });

  it("keeps the accent steps a layer sets", () => {
    const commerce = BRAND_THEMES.find(({ id }) => id === "commerce");
    const layer = commerce?.layer as {
      changes: { palette: { "accent-hover": { light: string } } };
    };
    expect(buildBrandTheme(layer).palette["accent-hover"]?.light).toBe(
      layer.changes.palette["accent-hover"].light,
    );
  });

  it.each(["medusa", "linear"])("draws the %s-inspired preset at WCAG AA in both schemes", (id) => {
    const preset = BRAND_THEMES.find((brand) => brand.id === id);
    expect(checkTheme(buildBrandTheme(preset?.layer)).map(({ detail }) => detail)).toEqual([]);
  });

  it("refuses a layer that is not a theme", () => {
    expect(() => buildBrandTheme({ format: "nope" })).toThrow();
  });
});
