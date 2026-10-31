/**
 * Stackra file contract:
 * Purpose: a theme as its web CSS custom properties, split into HeroUI's own (the colour roles, the shadows,
 *          `--radius`, `--field-radius`, `--field-border-width`, `--spacing`, `--border-width`, `--ring-offset-width`,
 *          `--disabled-opacity`) and Stackra's additions (palette, fonts, type styles and Tailwind's type scale,
 *          spacing, control heights, sizes and stacking, radius roles and steps, motion, the region colours, the glass
 *          material and the syntax colours, `--syntax-<role>`), each with its
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
import { FONT_FAMILY_VARIABLES } from "#core/constants/font-family-variables.constant";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";
import { fontStackOf } from "#core/functions/font-stack-of.function";
import { materialFill } from "#core/functions/material-fill.function";
import { materialLevelVariables } from "#core/functions/material-level-variables.function";
import { materialModeVariables } from "#core/functions/material-mode-variables.function";
import { springCurve } from "#core/functions/spring-curve.function";
import { syntaxColours } from "#core/functions/syntax-colours.function";

const SHADOWS = ["surface", "overlay", "field", "raised", "pressed"] as const;

/**
 * The radius roles, derived from the theme's field radius so every brand keeps its own corners: `control` for
 * fields, buttons, segmented controls and their segments, nav rows and tabs; `container` a step larger for cards,
 * popovers, menus, alerts, toasts, dialogs, tables and code frames (capped, so a round brand's panels stay panels);
 * `pill` for chips, avatars and counts. An element inside another takes the outer radius less the padding between
 * them: `control-inner` is a segment or thumb inside a control's 0.25rem padding, `container-inner` a row or body card
 * inside a container's. Both keep a 2px floor, so a small radius never squares the inner element off inside a rounded
 * one. A theme overrides a role by naming it in `radius.steps` (`control: "var(--radius-pill)"` for pill controls),
 * which is written after these.
 */
const RADIUS_ROLES = {
  "--radius-control": "var(--field-radius)",
  "--radius-control-inner": "max(2px, calc(var(--radius-control) - 0.25rem))",
  "--radius-container": "min(calc(var(--field-radius) * 2), 1.5rem)",
  "--radius-container-inner": "max(2px, calc(var(--radius-container) - 0.25rem))",
  "--radius-pill": "9999px",
  // Per component, each on its role; a theme overrides one by naming it in `radius.steps` (`button`, `card`).
  "--radius-button": "var(--radius-control)",
  "--radius-card": "var(--radius-container)",
  "--radius-chip": "var(--radius-pill)",
  "--radius-badge": "var(--radius-pill)",
  "--radius-avatar": "var(--radius-pill)",
  "--radius-tooltip": "var(--radius-control)",
  "--radius-modal": "var(--radius-container)",
  "--radius-toast": "var(--radius-container)",
  "--radius-table": "var(--radius-container)",
} as const;

/**
 * The material's properties of one colour mode: each level's fill, filter, edge, rim, specular, depth and elevation,
 * and the theme-wide edge, rim and sheen.
 */
function materialColours(theme: Theme, mode: "light" | "dark"): Record<string, string> {
  const { levels, edge, highlight } = theme.materials;
  return {
    ...Object.fromEntries(
      MaterialLevel.flatMap((level) => Object.entries(materialFill(level, levels[level], mode))),
    ),
    ...materialLevelVariables(theme, mode),
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

/** The utility type scale as Tailwind's theme variables (`--text-sm`, `--font-weight-medium`, `--tracking-tight`). */
const typeScaleVariables = ({ typeScale }: Theme): Record<string, string> => ({
  ...Object.fromEntries(
    Object.entries(typeScale.sizes).flatMap(([name, step]) => [
      [`--text-${name}`, step.fluidMin === undefined ? step.size : fluid(step.fluidMin, step.size)],
      [`--text-${name}--line-height`, step.lineHeight],
      ...(step.weight === undefined ? [] : [[`--text-${name}--font-weight`, String(step.weight)]]),
      ...(step.tracking === undefined ? [] : [[`--text-${name}--letter-spacing`, step.tracking]]),
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(typeScale.weights).map(([name, weight]) => [
      `--font-weight-${name}`,
      String(weight),
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(typeScale.tracking).map(([name, size]) => [`--tracking-${name}`, size]),
  ),
  ...Object.fromEntries(
    Object.entries(typeScale.leading).map(([name, size]) => [`--leading-${name}`, size]),
  ),
  "--numeric-figures": typeScale.numeric,
});

/** A size that grows with the viewport from `min` (at 40rem) to `max` (at 96rem), never past either. */
const fluid = (min: string, max: string) =>
  `clamp(${min}, calc(${min} + (${max} - ${min}) * ((100vw - 40rem) / 56)), ${max})`;

/** A record of values as `--<prefix>-<name>` properties. */
const record = (prefix: string, values: Readonly<Record<string, string>>) =>
  Object.fromEntries(Object.entries(values).map(([name, size]) => [`--${prefix}-${name}`, size]));

/**
 * The layout knobs Stackra adds: control and icon sizes, the touch target, the page frame, breakpoints, the corner
 * shape, the focus ring, the state layer, opacities, named sizes and the stacking order.
 */
const layoutVariables = ({ layout }: Theme): Record<string, string> => {
  return {
    ...record("control-height", layout.controlHeight),
    ...record("icon-size", layout.iconSize),
    "--touch-target": layout.touchTarget,
    "--page-padding": layout.page.padding,
    "--gutter": layout.page.gutter,
    "--content-max-width": layout.page.contentMaxWidth,
    ...record("breakpoint", layout.breakpoints),
    "--corner-shape": layout.cornerShape,
    "--focus-ring-width": layout.focusRing.width,
    "--focus-ring-style": layout.focusRing.style,
    ...record("state", layout.state),
    ...Object.fromEntries(
      Object.entries(layout.opacity)
        .filter(([name]) => name !== "disabled")
        .map(([name, share]) => [`--opacity-${name}`, share]),
    ),
    ...record("size", layout.sizes),
    ...record("z", layout.zIndex),
    // 1 keeps a directional icon as drawn; the stylesheet turns it to -1 in a right-to-left layout.
    "--mirror": "1",
  };
};

/** The web custom properties of `theme`, HeroUI's and Stackra's, for both colour modes. */
export function themeVariables(theme: Theme): ThemeVariables {
  const heroui = (mode: "light" | "dark") => ({
    ...Object.fromEntries(ColorRole.map((role) => [`--${role}`, theme.colors[role][mode]])),
    ...Object.fromEntries(
      SHADOWS.map((shadow) => [`--${shadow}-shadow`, theme.shadows[shadow][mode]]),
    ),
  });
  // Glass chrome's shadow; a theme without one floats on its overlay shadow.
  const floating = (mode: "light" | "dark") => ({
    "--floating-shadow": (theme.shadows.floating ?? theme.shadows.overlay)[mode],
  });
  const stackra = (mode: "light" | "dark") => ({
    ...Object.fromEntries(
      Object.entries(theme.palette).map(([name, token]) => [`--${name}`, token[mode]]),
    ),
    ...floating(mode),
    ...materialColours(theme, mode),
    // Per mode, so a region recomputes under a nested `[data-theme]` as HeroUI's derived colours do.
    ...Object.fromEntries(
      Object.entries(theme.layout.regions).map(([name, role]) => [`--${name}`, `var(--${role})`]),
    ),
    ...Object.fromEntries(
      Object.entries(syntaxColours(theme, mode)).map(([role, hex]) => [`--syntax-${role}`, hex]),
    ),
  });
  return {
    heroui: {
      root: {
        "--radius": theme.radius.base,
        "--field-radius": theme.radius.field,
        "--field-border-width": theme.layout.fieldBorderWidth,
        "--spacing": theme.layout.spacing,
        "--border-width": theme.layout.borderWidth,
        "--ring-offset-width": theme.layout.focusRing.offset,
        "--disabled-opacity": theme.layout.opacity["disabled"] ?? "0.5",
        "--cursor-interactive": theme.layout.cursor,
        "--skeleton-animation": theme.layout.skeleton,
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
        ...typeScaleVariables(theme),
        ...Object.fromEntries(
          Object.entries(theme.spacing).map(([name, size]) => [`--space-${name}`, size]),
        ),
        ...layoutVariables(theme),
        ...RADIUS_ROLES,
        ...Object.fromEntries(
          Object.entries(theme.radius.steps).map(([name, size]) => [`--radius-${name}`, size]),
        ),
        ...Object.fromEntries(
          Object.entries(theme.motion).flatMap(([name, step]) => [
            [`--duration-${name}`, step.duration],
            [`--ease-${name}`, step.easing],
          ]),
        ),
        // Tailwind's bare `transition-*` utilities take the theme's fast step.
        ...("fast" in theme.motion
          ? {
              "--default-transition-duration": "var(--duration-fast)",
              "--default-transition-timing-function": "var(--ease-fast)",
            }
          : {}),
        ...Object.fromEntries(
          Object.entries(theme.animation.easings).map(([name, easing]) => [
            `--ease-${name}`,
            easing,
          ]),
        ),
        ...Object.fromEntries(
          Object.entries(theme.animation.springs).flatMap(([name, spring]) => {
            const curve = springCurve(spring);
            return [
              [`--spring-${name}`, curve.css],
              [`--spring-${name}-duration`, `${curve.durationMs}ms`],
            ];
          }),
        ),
        // Tailwind's keyword easings (`ease-in`, `ease-out`, `ease-in-out`) read these, so they play the theme's curves.
        ...Object.fromEntries(
          (
            [
              ["--ease-in", "exit"],
              ["--ease-out", "enter"],
              ["--ease-in-out", "standard"],
            ] as const
          ).flatMap(([property, name]) => {
            const easing = theme.animation.easings[name];
            return easing === undefined ? [] : [[property, easing]];
          }),
        ),
        "--press-scale": String(theme.animation.pressScale),
        "--enter-distance": theme.animation.enterDistance,
        ...Object.fromEntries(
          MaterialLevel.flatMap((level) => [
            [`--material-${level}-blur`, theme.materials.levels[level].blur],
            [`--material-${level}-saturate`, String(theme.materials.levels[level].saturation)],
          ]),
        ),
        ...Object.fromEntries(
          Object.entries(theme.iconStroke ?? {}).map(([weight, width]) => [
            `--icon-stroke-${weight}`,
            String(width),
          ]),
        ),
        ...materialModeVariables(theme.materials.defaultMode ?? "glass"),
        // The accessibility scales: more contrast drops the tint, reduced transparency the rim (renderWebCss).
        "--material-tint-scale": "1",
        "--material-rim-scale": "1",
        "--material-edge-floor": "0",
      },
      light: stackra("light"),
      dark: stackra("dark"),
    },
  };
}
