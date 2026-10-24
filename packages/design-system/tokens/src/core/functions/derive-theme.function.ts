/**
 * Stackra file contract:
 * Purpose: derives a full theme from a base theme and a few knobs (the Theme Studio's controls).
 *          - Neutral roles: the neutral colour roles, and the graphite and accent palette steps, lean to the knobs'
 *            hue and chroma, and keep their lightness.
 *          - Accent: an accent colour replaces the accent family (accent, focus, link and the hover, pressed and soft
 *            steps) at fixed lightnesses per mode. Its foreground is white or ink, whichever contrasts more.
 *          - Rest: the radius, the font stacks and the name are replaced as given.
 *          The status colours, the brand's artwork colours and everything else stay as the base has them. Every hex
 *          is derived again from its oklch value.
 * Boundary: pure; returns a theme `defineTheme` has checked, so a knob that yields an unusable value throws
 *          InvalidThemeError. Colours that are not `oklch(…)` are kept as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio).
 */
import type { ColorToken, Theme } from "#contracts/types/theme.type";
import type { ThemeKnobs } from "#contracts/types/theme-knobs.type";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { defineTheme } from "#core/functions/define-theme.function";
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

const WHITE = "oklch(1 0 0)";

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

/** White or the base's ink, whichever stands further from `background` (a hex). */
function onColour(background: string, ink: string): string {
  return contrastRatio(oklchToHex(WHITE), background) >= contrastRatio(oklchToHex(ink), background)
    ? WHITE
    : ink;
}

/** The accent family for an accent of `hue` and `chroma`, on the base's ink. */
function accentFamily(hue: number, chroma: number, ink: string) {
  const accent = token(oklch(0.52, chroma, hue), oklch(0.74, chroma, hue));
  return {
    colors: {
      accent,
      "accent-foreground": token(onColour(accent.hexLight, ink), onColour(accent.hexDark, ink)),
      focus: accent,
      link: token(oklch(0.46, chroma, hue), oklch(0.8, chroma * 0.8, hue)),
    },
    palette: {
      "accent-hover": token(oklch(0.47, chroma, hue), oklch(0.69, chroma, hue)),
      "accent-pressed": token(oklch(0.42, chroma, hue), oklch(0.64, chroma, hue)),
      "accent-soft": token(oklch(0.94, chroma * 0.3, hue), oklch(0.3, chroma * 0.4, hue)),
      "accent-soft-foreground": token(oklch(0.42, chroma, hue), oklch(0.86, chroma * 0.7, hue)),
    },
  };
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
    ? accentFamily(knobs.accent.hue, knobs.accent.chroma, base.colors.foreground.light)
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
  });
}
