/**
 * Stackra file contract:
 * Purpose: proves diffTheme returns nothing for an unchanged theme and only the changed leaves, at their depth, for a
 *          changed one, and that mergeTheme applies such a diff back to the base, drops unsafe keys and refuses a diff
 *          whose result is not a usable theme.
 * Boundary: in-memory themes only.
 * Runtime: node
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0022 (test placement).
 */
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { deriveTheme } from "#core/functions/derive-theme.function";
import { diffTheme } from "#core/functions/diff-theme.function";
import { mergeTheme } from "#core/functions/merge-theme.function";

describe("diffTheme and mergeTheme", () => {
  it("finds no change between a theme and itself", () => {
    expect(diffTheme(STACKRA_THEME, STACKRA_THEME)).toEqual({});
  });

  it("keeps only the changed leaves, at their depth", () => {
    const theme = deriveTheme(STACKRA_THEME, { name: "acme", radius: 10 });
    expect(diffTheme(STACKRA_THEME, theme)).toEqual({ name: "acme", radius: { base: "10px" } });
  });

  it("applies a diff back to the base", () => {
    const theme = deriveTheme(STACKRA_THEME, { accent: { hue: 150, chroma: 0.12 }, radius: 8 });
    expect(mergeTheme(STACKRA_THEME, diffTheme(STACKRA_THEME, theme))).toEqual(theme);
  });

  it("drops unsafe keys instead of following them", () => {
    const diff = JSON.parse('{"__proto__": {"polluted": true}, "name": "acme"}') as ThemeDiff;
    const theme = mergeTheme(STACKRA_THEME, diff);
    expect(theme.name).toBe("acme");
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });

  it("refuses a diff whose result is not a usable theme", () => {
    expect(() =>
      mergeTheme(STACKRA_THEME, { colors: { accent: { light: "url(evil)" } } } as ThemeDiff),
    ).toThrow(InvalidThemeError);
  });
});
