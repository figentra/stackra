/**
 * Stackra file contract:
 * Purpose: unit tests of `deriveAccent`: a mid accent's soft label is the unclamped step under its accent, and a light
 *          accent (amber) still gets a soft label readable on its soft fill in both schemes; a `{ light, dark }` pair
 *          steps each scheme from its own accent, away from the label, so hover and pressed keep 4.5:1.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (contrast).
 */
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { deriveAccent } from "#core/functions/derive-accent.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

describe("deriveAccent", () => {
  it("leaves a mid accent's soft label inside the clamp", () => {
    // The base accent's light lightness is 0.546, so the label steps down 0.08 to 0.466, under the 0.47 clamp.
    const { palette } = deriveAccent(STACKRA_THEME, { hue: 248, chroma: 0.12 });
    expect(palette?.["accent-soft-foreground"]?.light).toBe("oklch(0.466 0.12 248)");
  });

  it.each(["light", "dark"] as const)("keeps an amber soft label readable in %s", (mode) => {
    const { palette } = deriveAccent(STACKRA_THEME, "oklch(0.83 0.15 82)");
    const fill = palette?.["accent-soft"]?.[mode] ?? "";
    const label = palette?.["accent-soft-foreground"]?.[mode] ?? "";
    expect(contrastRatio(oklchToHex(fill), oklchToHex(label))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["light", "dark"] as const)(
    "steps a per-scheme amber away from its dark label in %s",
    (mode) => {
      // Figentra's accents: a dark amber in light, a bright amber in dark, both under near-black text.
      const accent = { light: "oklch(0.61 0.12 75)", dark: "oklch(0.83 0.15 82)" };
      const { colors, palette } = deriveAccent(STACKRA_THEME, accent);
      const label = oklchToHex(colors?.["accent-foreground"]?.[mode] ?? "");
      const base = contrastRatio(label, oklchToHex(accent[mode]));
      for (const step of ["accent-hover", "accent-pressed"]) {
        const ratio = contrastRatio(label, oklchToHex(palette?.[step]?.[mode] ?? ""));
        expect(ratio).toBeGreaterThan(base);
      }
      expect(palette?.["accent-hover"]?.dark).toBe("oklch(0.88 0.15 82)");
    },
  );

  it("darkens the steps under a light label", () => {
    const { palette } = deriveAccent(STACKRA_THEME, { light: "#1F4FCC", dark: "#1F4FCC" });
    expect(palette?.["accent-hover"]?.light?.startsWith("oklch(0.4")).toBe(true);
  });
});
