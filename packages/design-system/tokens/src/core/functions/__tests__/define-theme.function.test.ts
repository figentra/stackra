/**
 * Stackra file contract:
 * Purpose: proves the token schema is enforced: a complete theme passes unchanged, and a missing role, an empty
 *          value, a bad hex, a non-kebab name, a palette entry that repeats a role or a value that would break the
 *          CSS each fail with InvalidThemeError naming the token.
 * Boundary: calls defineTheme on in-memory themes only.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0022 (test placement).
 */
import type { Theme } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { defineTheme } from "#core/functions/define-theme.function";

const problemsOf = (theme: unknown): readonly string[] => {
  try {
    defineTheme(theme as Theme);
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidThemeError);
    return (error as InvalidThemeError).problems;
  }
  return [];
};

// @covers sta-350:FR-001
describe("defineTheme", () => {
  it("returns a complete theme unchanged", () => {
    expect(defineTheme(STACKRA_THEME)).toBe(STACKRA_THEME);
  });

  it("names every missing colour role and font stack", () => {
    const { accent: _accent, ...colors } = STACKRA_THEME.colors;
    const { arabic: _arabic, ...fontFamily } = STACKRA_THEME.fontFamily;
    expect(problemsOf({ ...STACKRA_THEME, colors, fontFamily })).toEqual([
      "colors.accent is missing",
      "fontFamily.arabic is empty",
    ]);
  });

  it("refuses empty values and bad hex", () => {
    const accent = { light: " ", dark: "oklch(1 0 0)", hexLight: "#FFF", hexDark: "#FFFFFF" };
    expect(problemsOf({ ...STACKRA_THEME, colors: { ...STACKRA_THEME.colors, accent } })).toEqual([
      "colors.accent.light is empty",
      "colors.accent.hexLight is not #RRGGBB or #RRGGBBAA",
    ]);
  });

  it("refuses names that are not kebab-case and a palette entry that repeats a role", () => {
    expect(
      problemsOf({
        ...STACKRA_THEME,
        name: "Acme",
        spacing: { ...STACKRA_THEME.spacing, Large: "96px" },
        palette: { ...STACKRA_THEME.palette, accent: STACKRA_THEME.colors.accent },
      }),
    ).toEqual([
      "name is not a kebab-case token name",
      "palette.accent repeats a colour role",
      "spacing.Large is not a kebab-case token name",
    ]);
  });

  it("refuses a value that would end its CSS declaration or open a block", () => {
    const motion = { fast: { duration: "1ms; } body { color: red", easing: "ease" } };
    expect(problemsOf({ ...STACKRA_THEME, motion })).toEqual([
      'motion.fast.duration holds ";", "{", "}", "/*" or a line break',
    ]);
  });

  it("checks a text style's weight and font stack", () => {
    const typography = {
      body: { weight: 450.5, size: "16px", lineHeight: "1.5", family: "serif", letterSpacing: "0" },
    };
    expect(problemsOf({ ...STACKRA_THEME, typography })).toEqual([
      "typography.body.weight is not 100 to 900",
      "typography.body.family is not one of sans, mono, arabic",
    ]);
  });

  it("carries the validation category, the snake_case code and every problem in its message", () => {
    const error = new InvalidThemeError("acme", ["a is empty", "b is missing"]);
    expect([error.name, error.code, error.category, error.themeName]).toEqual([
      "InvalidThemeError",
      "invalid_theme",
      "validation",
      "acme",
    ]);
    expect(error.message).toBe('Theme "acme" is invalid: a is empty; b is missing');
  });
});
