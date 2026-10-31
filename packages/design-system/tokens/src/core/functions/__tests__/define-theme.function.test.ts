/**
 * Stackra file contract:
 * Purpose: proves the token schema is enforced: a complete theme passes unchanged, and a missing role, an empty
 *          value, a bad hex, a non-kebab name, two tokens that write one CSS property, or a value outside its kind's
 *          grammar (each CSS injection attempt among them), or a glass material out of its ranges fail with
 *          InvalidThemeError naming the token; the optional display font stacks are checked only when given.
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

const repeated = (part: string, separator: string): string =>
  `${Array.from({ length: 200 }, () => part).join(separator)} !`;
const withShadow = (light: string): unknown => ({
  ...STACKRA_THEME,
  shadows: { ...STACKRA_THEME.shadows, surface: { ...STACKRA_THEME.shadows.surface, light } },
});
const withEasing = (easing: string): unknown => ({
  ...STACKRA_THEME,
  motion: { fast: { duration: "1ms", easing } },
});
const withFont = (sans: string): unknown => ({
  ...STACKRA_THEME,
  fontFamily: { ...STACKRA_THEME.fontFamily, sans },
});

const withFonts = (fonts: Readonly<Record<string, string>>): unknown => ({
  ...STACKRA_THEME,
  fontFamily: { ...STACKRA_THEME.fontFamily, ...fonts },
});

// @covers sta-350:FR-001 sta-350:FR-020
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

  // Each value is long and fails only at its end, the input that makes an ambiguous pattern backtrack exponentially.
  it.each([
    ["shadow digit runs", withShadow(repeated("11", " ")), "shadows.surface.light"],
    ["shadow var() parts", withShadow(repeated("var(--a)", " ")), "shadows.surface.light"],
    ["shadow layers", withShadow(repeated("1px 1px var(--a)", ", ")), "shadows.surface.light"],
    ["easing arguments", withEasing(`cubic-bezier(${repeated("a  ", ",")}`), "motion.fast.easing"],
    ["font stack names", withFont(repeated("a b", " , ")), "fontFamily.sans"],
  ])("refuses a long malformed value in linear time: %s", (_, theme, path) => {
    const started = performance.now();
    const problems = problemsOf(theme);
    expect(performance.now() - started).toBeLessThan(100);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(new RegExp(`^${path.replaceAll(".", String.raw`\.`)} `));
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
      "typography.body.family is not one of sans, mono, arabic, display, displayArabic",
    ]);
  });

  // @covers sta-1386
  it("takes the display stacks as optional and checks them when given", () => {
    expect(problemsOf(withFonts({ display: '"Bricolage Grotesque", sans-serif' }))).toEqual([]);
    expect(
      problemsOf(withFonts({ display: "x; } body { color: red", displayArabic: " " })),
    ).toEqual(["fontFamily.display is not a CSS fontStack", "fontFamily.displayArabic is empty"]);
  });

  it("refuses a text style token that would write a display font property", () => {
    const typography = {
      ...STACKRA_THEME.typography,
      "font-display": STACKRA_THEME.typography["body"],
    };
    expect(problemsOf({ ...STACKRA_THEME, typography })).toContain(
      "--font-display is written by two tokens",
    );
  });

  it("is a validation refusal with the snake_case code and every problem in its details", () => {
    const error = InvalidThemeError.create({
      themeName: "acme",
      problems: ["a is empty", "b is missing"],
    });
    expect(error).toBeInstanceOf(Error);
    expect([error.name, error.code, error.category, error.themeName]).toEqual([
      "InvalidThemeError",
      "invalid_theme",
      "validation",
      "acme",
    ]);
    expect(error.problems).toEqual(["a is empty", "b is missing"]);
    expect(error.details).toEqual({ themeName: "acme", problems: ["a is empty", "b is missing"] });
  });

  it("refuses a type style the native renderer cannot turn into px", () => {
    const style = {
      weight: 400,
      size: "1rem",
      lineHeight: "1.5rem",
      family: "sans",
      letterSpacing: "1rem",
    };
    expect(problemsOf({ ...STACKRA_THEME, typography: { body: style } })).toEqual([
      "typography.body.size is not a px length, which the native type scale needs",
      "typography.body.lineHeight is not a unitless number or a px length, which the native type scale needs",
      "typography.body.letterSpacing is not zero, an em or a px length, which the native type scale needs",
    ]);
  });

  it("accepts the forms the native renderer can compute", () => {
    const style = {
      weight: 400,
      size: "16px",
      lineHeight: "24px",
      family: "sans",
      letterSpacing: "0",
    };
    expect(
      problemsOf({
        ...STACKRA_THEME,
        typography: {
          a: style,
          b: { ...style, lineHeight: "1.4", letterSpacing: "-0.01em" },
          c: { ...style, letterSpacing: "0.5px" },
        },
      }),
    ).toEqual([]);
  });

  it("refuses a material share outside 0 to 1, a blur that is not px, a wild saturation and a missing level", () => {
    const { levels } = STACKRA_THEME.materials;
    expect(
      problemsOf({
        ...STACKRA_THEME,
        materials: {
          levels: {
            thin: { ...levels.thin, fill: { light: 1.2, dark: -0.1 } },
            regular: { ...levels.regular, blur: "2rem", saturation: 9 },
          },
          edge: { light: 0.1 },
          highlight: STACKRA_THEME.materials.highlight,
        },
      }),
    ).toEqual([
      "materials.levels.ultra-thin is missing",
      "materials.levels.thin.fill.light is not a share from 0 to 1",
      "materials.levels.thin.fill.dark is not a share from 0 to 1",
      "materials.levels.regular.blur is not a px length",
      "materials.levels.regular.saturation is not a factor from 0 to 4",
      "materials.levels.thick is missing",
      "materials.levels.glass is missing",
      "materials.levels.glass-clear is missing",
      "materials.edge.dark is not a share from 0 to 1",
    ]);
    const { materials: _materials, ...withoutMaterials } = STACKRA_THEME;
    expect(problemsOf(withoutMaterials)).toEqual(["materials is missing"]);
  });

  it("refuses a palette colour that would overwrite a material property", () => {
    expect(
      problemsOf({
        ...STACKRA_THEME,
        palette: { ...STACKRA_THEME.palette, "material-edge": STACKRA_THEME.colors.border },
      }),
    ).toEqual(["--material-edge is written by two tokens"]);
  });

  // ADR 0501: the tokens v2 families are checked like the rest.
  it("refuses a layout, type scale or locale value out of its range or grammar", () => {
    expect(
      problemsOf({
        ...STACKRA_THEME,
        layout: {
          ...STACKRA_THEME.layout,
          spacing: "calc(1px + 1px)",
          cornerShape: "bevel",
          opacity: { disabled: "1.5" },
          zIndex: { overlay: "5.5" },
          regions: { sidebar: "var(--x)" },
        },
        typeScale: {
          ...STACKRA_THEME.typeScale,
          weights: { heavy: 1000 },
          numeric: "oldstyle-nums",
        },
        locale: { mirrorIcons: "yes", digits: "roman" },
      }),
    ).toEqual([
      "typeScale.weights.heavy is not 100 to 900",
      "typeScale.numeric is not tabular-nums, proportional-nums or normal",
      "layout.spacing is not a CSS length",
      "layout.cornerShape is not round or squircle",
      "layout.opacity.disabled is not a number from 0 to 1",
      "layout.zIndex.overlay is not an integer",
      "layout.regions.sidebar is not a kebab-case property name",
      "locale.mirrorIcons is not a boolean",
      "locale.digits is not latn or arab",
    ]);
  });

  it("accepts a multiple of a length token, the one calc() form", () => {
    expect(
      problemsOf({
        ...STACKRA_THEME,
        layout: { ...STACKRA_THEME.layout, controlHeight: { md: "calc(var(--spacing) * 9.5)" } },
      }),
    ).toEqual([]);
  });
});
