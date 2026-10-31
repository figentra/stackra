/**
 * Stackra file contract:
 * Purpose: derives a full theme from a base theme and a few knobs (the Theme Studio's controls).
 *          - Neutral roles: the neutral colour roles, and the graphite and accent palette steps, lean to the knobs'
 *            hue and chroma, and keep their lightness.
 *          - Accent: an accent hue and chroma replace the accent family (accent, its foreground, focus and the hover,
 *            pressed and soft steps) through `deriveAccent`, at the base accent's own lightness in each scheme; no
 *            fixed lightness, and the link stays the base's (ADR 0340 decision 4, ADR 0319).
 *          - Material: a level's fill share (both schemes) and blur replace the base's.
 *          - Shape and size (ADR 0501): the base radius, pill controls, the spacing unit (density), the field style
 *            (bordered or lifted) and the corner shape.
 *          - Type: a font-size multiplier, a line-height multiplier and added letter spacing reach every text style
 *            and type-scale step; the neutral tint leans the neutrals toward the accent's hue.
 *          - Elevation and behaviour: each role's shadow strength (SHADOW_STRENGTHS), the forms radius, the field edge
 *            width, the disabled opacity, the pointer cursor, the skeleton, the vibrant palette and the animations
 *            switch.
 *          - Rest: the font stacks and the name are replaced as given.
 *          The status colours, the brand's artwork colours and everything else stay as the base has them. Every hex
 *          is derived again from its oklch value.
 * Boundary: pure; returns a theme `defineTheme` has checked, so a knob that yields an unusable value throws
 *          InvalidThemeError. Colours that are not `oklch(…)` are kept as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio); ADR 0340 (decision 4).
 */
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeMaterials } from "#contracts/types/theme-materials.type";
import type { ThemeKnobs } from "#contracts/types/theme-knobs.type";
import { SHADOW_STRENGTHS } from "#core/constants/shadow-strengths.constant";
import { defineTheme } from "#core/functions/define-theme.function";
import { deriveAccent } from "#core/functions/derive-accent.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

/** The radius: the base knob, and pill controls when asked (or the base's own control radius when not). */
function radiusOf(base: Theme, knobs: ThemeKnobs): Theme["radius"] {
  const withBase =
    knobs.radius === undefined ? base.radius : { ...base.radius, base: `${knobs.radius}px` };
  const basePx = knobs.radius ?? pxIn(base.radius.base) ?? 4;
  const radius =
    knobs.formsRadius === undefined
      ? withBase
      : { ...withBase, field: `${Math.round(basePx * knobs.formsRadius * 100) / 100}px` };
  if (knobs.pillControls === undefined) return radius;
  const steps = Object.fromEntries(
    Object.entries(radius.steps).filter(([name]) => name !== "control"),
  );
  return {
    ...radius,
    steps: knobs.pillControls ? { ...steps, control: "var(--radius-pill)" } : steps,
  };
}

/** The tint knob as the neutral hue (the accent's) and chroma (a share of 0.03) it stands for. */
function withTint(base: Theme, knobs: ThemeKnobs): ThemeKnobs {
  if (knobs.neutralTint === undefined) return knobs;
  const accentHue =
    knobs.accent?.hue ??
    Number(/^oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)/.exec(base.colors.accent.light)?.[1] ?? 0);
  return {
    ...knobs,
    neutralHue: accentHue,
    neutralChroma: Math.round(knobs.neutralTint * 0.03 * 1000) / 1000,
  };
}

/** A px length as a number, or `undefined`. */
const pxIn = (length: string) => {
  const match = /^(-?[\d.]+)(px|rem)$/.exec(length.trim());
  return match ? Number(match[1]) * (match[2] === "rem" ? 16 : 1) : undefined;
};

/** A length multiplied, keeping its unit (`14px` × 1.1 is `15.4px`). */
const scaled = (length: string, factor: number) => {
  const match = /^(-?[\d.]+)(px|rem|em)$/.exec(length.trim());
  return match ? `${Math.round(Number(match[1]) * factor * 10_000) / 10_000}${match[2]}` : length;
};

/** A unitless line height multiplied; any other form as it is. */
const leading = (height: string, factor: number) =>
  /^[\d.]+$/.test(height) ? String(Math.round(Number(height) * factor * 1000) / 1000) : height;

/** Letter spacing with `extra` em added, when it is zero or in em. */
const tracked = (spacing: string, extra: number) => {
  const match = /^(-?[\d.]+)(em)?$/.exec(spacing.trim());
  return match ? `${Math.round((Number(match[1]) + extra) * 1000) / 1000}em` : spacing;
};

/** The text styles and the type scale with the size, line-height and tracking knobs applied. */
function typeOf(base: Theme, knobs: ThemeKnobs): Pick<Theme, "typography" | "typeScale"> {
  const size = knobs.fontScale ?? 1;
  const height = knobs.lineHeight ?? 1;
  const extra = knobs.letterSpacing ?? 0;
  if (size === 1 && height === 1 && extra === 0)
    return { typography: base.typography, typeScale: base.typeScale };
  return {
    typography: Object.fromEntries(
      Object.entries(base.typography).map(([name, style]) => [
        name,
        {
          ...style,
          size: scaled(style.size, size),
          lineHeight: leading(style.lineHeight, height),
          letterSpacing: tracked(style.letterSpacing, extra),
        },
      ]),
    ),
    typeScale: {
      ...base.typeScale,
      sizes: Object.fromEntries(
        Object.entries(base.typeScale.sizes).map(([name, step]) => [
          name,
          {
            ...step,
            size: scaled(step.size, size),
            lineHeight: leading(step.lineHeight, height),
            ...(extra === 0 ? {} : { tracking: tracked(step.tracking ?? "0em", extra) }),
          },
        ]),
      ),
    },
  };
}

/** The shadows with each role's strength knob in place. */
function shadowsOf(base: Theme, knobs: ThemeKnobs): Theme["shadows"] {
  const picked = knobs.shadows;
  if (!picked) return base.shadows;
  return {
    ...base.shadows,
    ...Object.fromEntries(
      (["surface", "overlay", "field"] as const).flatMap((role) => {
        const strength = picked[role];
        return strength === undefined ? [] : [[role, SHADOW_STRENGTHS[role][strength]]];
      }),
    ),
  };
}

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/;

/** A colour at or below this oklch chroma is a neutral, which the neutral knobs move. */
const NEUTRAL_CHROMA = 0.03;

/** The roles that stay as the base has them: the status colours and the text drawn on them. */
const KEPT_ROLES = new Set([
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "danger",
  "danger-foreground",
]);

/** The palette steps the neutral knobs move: the graphite ramp and the accent steps. */
const MOVED_PALETTE = /^(graphite-\d+|accent-.+)$/;

const round = (value: number, digits: number) => Number(value.toFixed(digits));

/** `oklch(L C H [/ A])` from its parts, rounded as the themes write them. */
const oklch = (lightness: number, chroma: number, hue: number, alpha?: string) =>
  `oklch(${round(lightness, 3)} ${round(chroma, 3)} ${round(hue, 1)}${alpha === undefined ? "" : ` / ${alpha}`})`;

/** A colour token from its two modes, with each hex derived. */
const token = (light: string, dark: string): ColorToken => ({
  light,
  dark,
  hexLight: oklchToHex(light),
  hexDark: oklchToHex(dark),
});

/** `colour` leaning to the neutral knobs, when it is an oklch neutral; anything else as it is. */
function lean(colour: string, knobs: ThemeKnobs): string {
  const match = OKLCH.exec(colour.trim());
  if (!match || (knobs.neutralHue === undefined && knobs.neutralChroma === undefined))
    return colour;
  const [lightness, chroma, hue] = match.slice(1, 4).map(Number) as [number, number, number];
  if (chroma > NEUTRAL_CHROMA) return colour;
  return oklch(lightness, knobs.neutralChroma ?? chroma, knobs.neutralHue ?? hue, match[4]);
}

const leanToken = (colour: ColorToken, knobs: ThemeKnobs): ColorToken => {
  const light = lean(colour.light, knobs);
  const dark = lean(colour.dark, knobs);
  return light === colour.light && dark === colour.dark ? colour : token(light, dark);
};

/** The base's material with each level knob in place: a fill share in both schemes, a blur in px. */
function materialsOf(base: ThemeMaterials, knobs: ThemeKnobs["materials"]): ThemeMaterials {
  if (!knobs) return base;
  const levels = Object.fromEntries(
    MaterialLevel.map((level) => {
      const own = base.levels[level];
      const knob = knobs[level];
      return [
        level,
        knob === undefined || (knob.fill === undefined && knob.blur === undefined)
          ? own
          : {
              ...own,
              ...(knob.fill === undefined ? {} : { fill: { light: knob.fill, dark: knob.fill } }),
              ...(knob.blur === undefined ? {} : { blur: `${knob.blur}px` }),
            },
      ];
    }),
  ) as ThemeMaterials["levels"];
  return { ...base, levels };
}

/**
 * A full theme from `base` and `knobs`.
 *
 * @throws InvalidThemeError when a knob yields a value the theme schema refuses (a bad name or font stack)
 */
export function deriveTheme(base: Theme, given: ThemeKnobs): Theme {
  const knobs = withTint(base, given);
  const colors = Object.fromEntries(
    Object.entries(base.colors).map(([role, colour]) => [
      role,
      KEPT_ROLES.has(role) ? colour : leanToken(colour, knobs),
    ]),
  ) as Theme["colors"];
  const palette = Object.fromEntries(
    Object.entries(base.palette).map(([name, colour]) => [
      name,
      MOVED_PALETTE.test(name) ? leanToken(colour, knobs) : colour,
    ]),
  );
  const accent = knobs.accent
    ? (deriveAccent({ ...base, colors }, knobs.accent) as {
        readonly colors: Partial<Theme["colors"]>;
        readonly palette: Theme["palette"];
      })
    : undefined;

  return defineTheme({
    ...base,
    name: knobs.name ?? base.name,
    colors: { ...colors, ...accent?.colors },
    palette: { ...palette, ...accent?.palette },
    fontFamily: {
      ...base.fontFamily,
      ...(knobs.fontSans === undefined ? {} : { sans: knobs.fontSans }),
      ...(knobs.fontArabic === undefined ? {} : { arabic: knobs.fontArabic }),
    },
    radius: radiusOf(base, knobs),
    ...typeOf(base, knobs),
    shadows: shadowsOf(base, knobs),
    layout: {
      ...base.layout,
      ...(knobs.vibrant === undefined ? {} : { vibrant: knobs.vibrant }),
      ...(knobs.fieldBorderWidth === undefined
        ? {}
        : { fieldBorderWidth: `${knobs.fieldBorderWidth}px` }),
      ...(knobs.disabledOpacity === undefined
        ? {}
        : { opacity: { ...base.layout.opacity, disabled: String(knobs.disabledOpacity) } }),
      ...(knobs.cursorPointer === undefined
        ? {}
        : { cursor: knobs.cursorPointer ? "pointer" : "default" }),
      ...(knobs.skeleton === undefined ? {} : { skeleton: knobs.skeleton }),
      ...(knobs.animations === undefined ? {} : { animations: knobs.animations }),
      ...(knobs.spacing === undefined ? {} : { spacing: `${knobs.spacing / 16}rem` }),
      ...(knobs.fieldStyle === undefined
        ? {}
        : { fieldBorderWidth: knobs.fieldStyle === "lifted" ? "0px" : "1px" }),
      ...(knobs.cornerShape === undefined ? {} : { cornerShape: knobs.cornerShape }),
    },
    materials: materialsOf(base.materials, knobs.materials),
  });
}
