/**
 * Stackra file contract:
 * Purpose: derives a full theme from a base theme and a few knobs (the Theme Studio's controls).
 *          - Neutral roles: the neutral colour roles, and the graphite and accent palette steps, lean to the knobs'
 *            hue and chroma, and keep their lightness.
 *          - Accent: an accent hue and chroma replace the accent family (accent, its foreground, focus and the hover,
 *            pressed and soft steps) through `deriveAccent`, at the base accent's own lightness in each scheme; no
 *            fixed lightness, and the link stays the base's (ADR 0340 decision 4, ADR 0319).
 *          - Material: a level's fill share (both schemes) and blur replace the base's.
 *          - Rest: the radius, the font stacks and the name are replaced as given.
 *          The status colours, the brand's artwork colours and everything else stay as the base has them. Every hex
 *          is derived again from its oklch value.
 * Boundary: pure; returns a theme `defineTheme` has checked, so a knob that yields an unusable value throws
 *          InvalidThemeError. Colours that are not `oklch(…)` are kept as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio); ADR 0340 (decision 4).
 */
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { ColorToken, Theme, ThemeMaterials } from "#contracts/types/theme.type";
import type { ThemeKnobs } from "#contracts/types/theme-knobs.type";
import { defineTheme } from "#core/functions/define-theme.function";
import { deriveAccent } from "#core/functions/derive-accent.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

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
export function deriveTheme(base: Theme, knobs: ThemeKnobs): Theme {
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
    radius:
      knobs.radius === undefined ? base.radius : { ...base.radius, base: `${knobs.radius}px` },
    materials: materialsOf(base.materials, knobs.materials),
  });
}
