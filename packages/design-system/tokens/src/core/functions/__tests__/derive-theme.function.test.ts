/**
 * Stackra file contract:
 * Purpose: proves deriveTheme keeps the base with no knobs, leans only the neutral roles and graphite/accent steps to
 *          the neutral knobs (keeping their lightness, the status colours and the brand artwork), replaces the accent
 *          family with an accent whose foreground contrasts most, sets the radius, fonts and name, re-derives every
 *          hex, and refuses a knob that yields an unusable theme.
 * Boundary: in-memory themes only.
 * Runtime: node
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { deriveTheme } from "#core/functions/derive-theme.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

describe("deriveTheme", () => {
  it("returns the base's values when no knob is given", () => {
    expect(deriveTheme(STACKRA_THEME, {})).toEqual(STACKRA_THEME);
  });

  it("leans the neutrals to the knobs' hue and chroma and keeps their lightness", () => {
    const theme = deriveTheme(STACKRA_THEME, { neutralHue: 30, neutralChroma: 0.02 });
    expect(theme.colors.surface.dark).toBe("oklch(0.195 0.02 30)");
    expect(theme.colors.surface.hexDark).toBe(oklchToHex("oklch(0.195 0.02 30)"));
    expect(theme.colors.backdrop.light).toBe("oklch(0.158 0.02 30 / 0.4)");
    expect(theme.palette["graphite-700"]?.light).toBe("oklch(0.38 0.02 30)");
  });

  it("keeps the status colours and the brand's artwork colours", () => {
    const theme = deriveTheme(STACKRA_THEME, { neutralHue: 30, neutralChroma: 0.02 });
    expect(theme.colors.danger).toBe(STACKRA_THEME.colors.danger);
    expect(theme.colors["success-foreground"]).toBe(STACKRA_THEME.colors["success-foreground"]);
    expect(theme.palette.steel).toBe(STACKRA_THEME.palette.steel);
    expect(theme.palette.amber).toBe(STACKRA_THEME.palette.amber);
  });

  it("replaces the accent family and gives the accent the foreground that contrasts most", () => {
    const theme = deriveTheme(STACKRA_THEME, { accent: { hue: 250, chroma: 0.15 } });
    expect(theme.colors.accent.light).toBe("oklch(0.52 0.15 250)");
    expect(theme.colors.focus).toEqual(theme.colors.accent);
    expect(theme.palette["accent-hover"]?.light).toBe("oklch(0.47 0.15 250)");
    for (const mode of ["hexLight", "hexDark"] as const) {
      const on = contrastRatio(theme.colors["accent-foreground"][mode], theme.colors.accent[mode]);
      const other =
        theme.colors["accent-foreground"][mode] === "#FFFFFF"
          ? STACKRA_THEME.colors.foreground.hexLight
          : "#FFFFFF";
      expect(on).toBeGreaterThanOrEqual(contrastRatio(other, theme.colors.accent[mode]));
    }
  });

  it("sets the radius, the font stacks and the name", () => {
    const theme = deriveTheme(STACKRA_THEME, {
      name: "acme",
      radius: 12,
      fontSans: "system-ui, sans-serif",
      fontArabic: '"Noto Kufi Arabic", system-ui',
    });
    expect(theme.name).toBe("acme");
    expect(theme.radius.base).toBe("12px");
    expect(theme.fontFamily.sans).toBe("system-ui, sans-serif");
    expect(theme.fontFamily.arabic).toBe('"Noto Kufi Arabic", system-ui');
    expect(theme.fontFamily.mono).toBe(STACKRA_THEME.fontFamily.mono);
  });

  it("refuses a knob that yields an unusable theme", () => {
    expect(() => deriveTheme(STACKRA_THEME, { name: "Not Kebab" })).toThrow(InvalidThemeError);
    expect(() => deriveTheme(STACKRA_THEME, { fontSans: "x; } body { color: red" })).toThrow(
      InvalidThemeError,
    );
  });
});
