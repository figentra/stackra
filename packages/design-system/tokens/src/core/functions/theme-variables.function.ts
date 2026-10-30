/**
 * Stackra file contract:
 * Purpose: a theme as its web CSS custom properties, split into HeroUI's own (the colour roles, the three shadows,
 *          `--radius`, `--field-radius`, `--field-border-width`) and Stackra's additions (palette, fonts, type, spacing,
 *          radius steps and roles, motion, the glass material and the syntax colours, `--syntax-<role>`), each with its
 *          mode-independent set and one per colour mode. `renderWebCss` writes these; the Theme Studio sets them inline
 *          on its preview and exports them as JSON. Every font stack is written, the display ones resolved
 *          (`--font-display` is the sans stack when the theme sets none, and `--font-display-arabic` the arabic one),
 *          and a text style names its stack's property.
 * Boundary: a pure function from a Theme to property names (with their leading `--`) and values; it validates
 *          nothing (`defineTheme` does). The material's fills and filters sit in the colour sets, so an element that
 *          sets a mode's set computes them again from its own surface.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0165 (HeroUI v3 on the web); ADR 0320 (the material).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { FontFamilyName } from "#contracts/types/font-family-name.type";
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeVariables } from "#contracts/types/theme-variables.type";
import { FIELD_BORDER_WIDTH } from "#core/constants/field-border-width.constant";
import { FONT_FAMILY_VARIABLES } from "#core/constants/font-family-variables.constant";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";
import { fontStackOf } from "#core/functions/font-stack-of.function";
import { materialModeVariables } from "#core/functions/material-mode-variables.function";
import { syntaxColours } from "#core/functions/syntax-colours.function";

const SHADOWS = ["surface", "overlay", "field"] as const;

/**
 * The radius roles, derived from the theme's field radius so every brand keeps its own corners: `control` for
 * fields, buttons, segmented controls and their segments, nav rows and tabs; `container` a step larger for cards,
 * popovers, menus and code frames (capped, so a round brand's panels stay panels); `pill` for chips and counts only.
 * An element inside another takes the outer radius less the padding between them: `control-inner` is a segment or
 * thumb inside a control's 0.25rem padding.
 */
const RADIUS_ROLES = {
  "--radius-control": "var(--field-radius)",
  "--radius-control-inner": "max(0px, calc(var(--field-radius) - 0.25rem))",
  "--radius-container": "min(calc(var(--field-radius) * 2), 1.5rem)",
  "--radius-pill": "9999px",
} as const;

/** The least fill share of a level: the mode's floor, and for the thick level, which muted text sits on, its own too. */
const floorOf = (level: MaterialLevel) =>
  level === "thick"
    ? "max(var(--material-fill-floor), var(--material-thick-floor))"
    : "var(--material-fill-floor)";

/** The material's properties of one colour mode: each level's share, fill and filter, the edge, rim and sheen. */
function materialColours(theme: Theme, mode: "light" | "dark"): Record<string, string> {
  const { levels, edge, highlight } = theme.materials;
  return {
    ...Object.fromEntries(
      MaterialLevel.flatMap((level) => [
        [`--material-${level}-share`, String(levels[level].fill[mode])],
        [
          `--material-${level}-fill`,
          `color-mix(in oklch, var(--surface) calc(clamp(${floorOf(level)}, var(--material-${level}-share) * var(--material-fill-scale), 1) * 100%), transparent)`,
        ],
        [
          `--material-${level}-filter`,
          `blur(calc(var(--material-${level}-blur) * var(--material-blur-scale))) saturate(calc(var(--material-${level}-saturate) * var(--material-saturate-scale))) brightness(var(--material-brightness))`,
        ],
      ]),
    ),
    "--material-edge-share": String(edge[mode]),
    "--material-highlight-share": String(highlight[mode]),
    "--material-edge":
      "color-mix(in oklch, var(--foreground) calc(var(--material-edge-share) * 100%), transparent)",
    "--material-highlight":
      "color-mix(in oklch, oklch(1 0 0) calc(var(--material-highlight-share) * 100%), transparent)",
    // A control's glass: the thick level, never thinner than the frosted mode's floor, so a label holds 4.5:1 over
    // any backdrop in every mode (ADR 0319 decision 2).
    "--material-control-fill": `color-mix(in oklch, var(--surface) calc(clamp(max(var(--material-fill-floor), ${MATERIAL_MODES.frosted.fillFloor}), var(--material-thick-share) * var(--material-fill-scale), 1) * 100%), transparent)`,
    "--material-sheen-color":
      "color-mix(in oklch, oklch(1 0 0) calc(var(--material-sheen) * var(--material-highlight-share) * 100%), transparent)",
  };
}

/** The web custom properties of `theme`, HeroUI's and Stackra's, for both colour modes. */
export function themeVariables(theme: Theme): ThemeVariables {
  const heroui = (mode: "light" | "dark") => ({
    ...Object.fromEntries(ColorRole.map((role) => [`--${role}`, theme.colors[role][mode]])),
    ...Object.fromEntries(
      SHADOWS.map((shadow) => [`--${shadow}-shadow`, theme.shadows[shadow][mode]]),
    ),
  });
  const stackra = (mode: "light" | "dark") => ({
    ...Object.fromEntries(
      Object.entries(theme.palette).map(([name, token]) => [`--${name}`, token[mode]]),
    ),
    ...materialColours(theme, mode),
    ...Object.fromEntries(
      Object.entries(syntaxColours(theme, mode)).map(([role, hex]) => [`--syntax-${role}`, hex]),
    ),
  });
  return {
    heroui: {
      root: {
        "--radius": theme.radius.base,
        "--field-radius": theme.radius.field,
        "--field-border-width": FIELD_BORDER_WIDTH,
      },
      light: heroui("light"),
      dark: heroui("dark"),
    },
    stackra: {
      root: {
        ...Object.fromEntries(
          Object.entries(FONT_FAMILY_VARIABLES).map(([family, name]) => [
            `--${name}`,
            fontStackOf(theme, family as FontFamilyName),
          ]),
        ),
        ...Object.fromEntries(
          Object.entries(theme.typography).flatMap(([name, style]) => [
            [
              `--${name}`,
              `${style.weight} ${style.size}/${style.lineHeight} var(--${FONT_FAMILY_VARIABLES[style.family]})`,
            ],
            [`--${name}-letter-spacing`, style.letterSpacing],
          ]),
        ),
        ...Object.fromEntries(
          Object.entries(theme.spacing).map(([name, size]) => [`--space-${name}`, size]),
        ),
        ...Object.fromEntries(
          Object.entries(theme.radius.steps).map(([name, size]) => [`--radius-${name}`, size]),
        ),
        ...RADIUS_ROLES,
        ...Object.fromEntries(
          Object.entries(theme.motion).flatMap(([name, step]) => [
            [`--duration-${name}`, step.duration],
            [`--ease-${name}`, step.easing],
          ]),
        ),
        ...Object.fromEntries(
          MaterialLevel.flatMap((level) => [
            [`--material-${level}-blur`, theme.materials.levels[level].blur],
            [`--material-${level}-saturate`, String(theme.materials.levels[level].saturation)],
          ]),
        ),
        ...materialModeVariables("glass"),
      },
      light: stackra("light"),
      dark: stackra("dark"),
    },
  };
}
