/**
 * Stackra file contract:
 * Purpose: a theme as its web CSS custom properties, split into HeroUI's own (the colour roles, the three shadows,
 *          `--radius`, `--field-radius`) and Stackra's additions (palette, fonts, type, spacing, radius steps, motion and
 *          the glass material), each with its mode-independent set and one per colour mode. `renderWebCss` writes
 *          these; the Theme Studio sets them inline on its preview and exports them as JSON.
 * Boundary: a pure function from a Theme to property names (with their leading `--`) and values; it validates
 *          nothing (`defineTheme` does). The material's fills and filters sit in the colour sets, so an element that
 *          sets a mode's set computes them again from its own surface.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0165 (HeroUI v3 on the web); ADR 0320 (the material).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeVariables } from "#contracts/types/theme-variables.type";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";
import { materialModeVariables } from "#core/functions/material-mode-variables.function";

const SHADOWS = ["surface", "overlay", "field"] as const;
const FONT_FAMILIES = ["sans", "mono", "arabic"] as const;

/** The material's properties of one colour mode: each level's share, fill and filter, the edge, rim and sheen. */
function materialColours(theme: Theme, mode: "light" | "dark"): Record<string, string> {
  const { levels, edge, highlight } = theme.materials;
  return {
    ...Object.fromEntries(
      MaterialLevel.flatMap((level) => [
        [`--material-${level}-share`, String(levels[level].fill[mode])],
        [
          `--material-${level}-fill`,
          `color-mix(in oklch, var(--surface) calc(clamp(var(--material-fill-floor), var(--material-${level}-share) * var(--material-fill-scale), 1) * 100%), transparent)`,
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
  });
  return {
    heroui: {
      root: { "--radius": theme.radius.base, "--field-radius": theme.radius.field },
      light: heroui("light"),
      dark: heroui("dark"),
    },
    stackra: {
      root: {
        ...Object.fromEntries(
          FONT_FAMILIES.map((family) => [`--font-${family}`, theme.fontFamily[family]]),
        ),
        ...Object.fromEntries(
          Object.entries(theme.typography).flatMap(([name, style]) => [
            [
              `--${name}`,
              `${style.weight} ${style.size}/${style.lineHeight} var(--font-${style.family})`,
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
