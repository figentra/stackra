/**
 * Stackra file contract:
 * Purpose: proves the token schema is enforced: a complete theme passes unchanged, and a missing role, an empty
 *          value, a bad hex, a non-kebab name, two tokens that write one CSS property, or a value outside its kind's
 *          grammar (each CSS injection attempt among them) fail with InvalidThemeError naming the token.
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
      "spacing.Large is not a kebab-case token name",
      "--accent is written by two tokens",
    ]);
  });

  it("refuses keys that would write a property another token writes", () => {
    expect(
      problemsOf({
        ...STACKRA_THEME,
        palette: { radius: STACKRA_THEME.colors.accent, "space-1": STACKRA_THEME.colors.accent },
        typography: {
          ...STACKRA_THEME.typography,
          "surface-shadow": STACKRA_THEME.typography["body"],
        },
        motion: { ...STACKRA_THEME.motion, "1": { duration: "1ms", easing: "ease" } },
        spacing: { ...STACKRA_THEME.spacing },
        radius: {
          ...STACKRA_THEME.radius,
          steps: { ...STACKRA_THEME.radius.steps, "letter-spacing": "1px" },
        },
      }),
    ).toEqual([
      "--surface-shadow is written by two tokens",
      "--space-1 is written by two tokens",
      "--radius is written by two tokens",
    ]);
  });

  it("refuses a value that would end its CSS declaration or open a block", () => {
    const motion = { fast: { duration: "1ms; } body { color: red", easing: "ease" } };
    expect(problemsOf({ ...STACKRA_THEME, motion })).toEqual([
      "motion.fast.duration is not a CSS duration",
    ]);
  });

  it("refuses a long malformed shadow in linear time", () => {
    const light = `${Array.from({ length: 60 }, () => "11").join(" ")} x`;
    const shadows = {
      ...STACKRA_THEME.shadows,
      surface: { ...STACKRA_THEME.shadows.surface, light },
    };
    const started = performance.now();
    expect(problemsOf({ ...STACKRA_THEME, shadows })).toEqual([
      "shadows.surface.light is not a CSS shadow",
    ]);
    expect(performance.now() - started).toBeLessThan(100);
  });

  it.each([
    "oklch(1 0 0)\\", // a trailing backslash escapes the renderer's semicolon
    "oklch(1 0 0",
    'oklch(1 0 0)"',
    "oklch(1 0 0)'",
    "oklch(1 0 0)</style><script>alert(1)</script>",
    "oklch(1 0 0) < 2",
    "oklch(1 0 0); color: red",
    "oklch(1 0 0) } * {",
    "oklch(1 0 0) /* x */",
    "url(https://example.com/x)",
    "expression(alert(1))",
  ])("refuses %j in every kind of value", (attack) => {
    const color = { light: attack, dark: attack, hexLight: "#FFFFFF", hexDark: "#FFFFFF" };
    expect(
      problemsOf({
        ...STACKRA_THEME,
        colors: { ...STACKRA_THEME.colors, accent: color },
        fontFamily: { ...STACKRA_THEME.fontFamily, sans: `"Geist", ${attack}` },
        spacing: { "1": attack },
        radius: { ...STACKRA_THEME.radius, base: attack },
        shadows: { ...STACKRA_THEME.shadows, field: { light: `0px 1px ${attack}`, dark: attack } },
        motion: { fast: { duration: attack, easing: attack } },
      }),
    ).toEqual([
      "colors.accent.light is not a CSS color",
      "colors.accent.dark is not a CSS color",
      "fontFamily.sans is not a CSS fontStack",
      "spacing.1 is not a CSS length",
      "radius.base is not a CSS length",
      "shadows.field.light is not a CSS shadow",
      "shadows.field.dark is not a CSS shadow",
      "motion.fast.duration is not a CSS duration",
      "motion.fast.easing is not a CSS easing",
    ]);
  });

  it("accepts the CSS forms themes are written in", () => {
    expect(
      problemsOf({
        ...STACKRA_THEME,
        fontFamily: { ...STACKRA_THEME.fontFamily, sans: "'Inter Var', Segoe UI, sans-serif" },
        spacing: { "1": "0.25rem", "2": "8px", "3": "var(--space-2)" },
        shadows: {
          ...STACKRA_THEME.shadows,
          field: { light: "none", dark: "inset 0 1px 0 0 #000000AA" },
        },
        motion: { fast: { duration: "0.2s", easing: "cubic-bezier(0.2, 0, 0, 1)" } },
      }),
    ).toEqual([]);
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
