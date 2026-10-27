/**
 * Stackra file contract:
 * Purpose: ADR 0340 decision 4's accent derivation, the one way a product layer or a tenant's single colour becomes an
 *          accent family. The submitted accent is kept as given: a colour string (`oklch(L C H)` or `#RRGGBB`) is the
 *          accent in both schemes, and a hue and chroma take the base accent's own lightness in each scheme. From it,
 *          per scheme, come only its steps, relative to its own lightness (the stackra theme's ADR 0319 steps):
 *          - `accent-hover` 0.05 darker and `accent-pressed` 0.1 darker, at its chroma;
 *          - `accent-soft`, a tint on the page: the base `background`'s lightness, 0.03 darker (light) or 0.13 lighter
 *            (dark), at a quarter (light) or 0.45 (dark) of its chroma;
 *          - `accent-soft-foreground`, 0.08 darker at its chroma (light) or 0.13 lighter at 0.64 of it (dark);
 *          - `accent-foreground`, the base's `background` or `foreground`, whichever stands further from it;
 *          - `focus`, the accent itself; `link` only when asked, the accent itself (ADR 0319 keeps it neutral).
 * Boundary: pure; returns a changes-only diff for a layer or `mergeTheme`, and checks nothing: `checkTheme` and
 *           `resolveTheme` measure the result and refuse with a suggestion, and nothing here moves the accent to pass.
 *           A lightness step that leaves 0 to 1 stops at the edge.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4); ADR 0319 (the accent steps).
 */
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";
import { srgbToOklab } from "#core/functions/srgb-to-oklab.function";

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/;
const OKLCH_LIGHTNESS = /^oklch\(\s*([\d.]+)\s/;
const HEX = /^#[\dA-Fa-f]{6}$/;

/** Lightness, chroma and hue. */
type Lch = readonly [number, number, number];

const round = (number: number, digits: number) => Number(number.toFixed(digits));
const unit = (number: number) => Math.min(1, Math.max(0, number));

/** `oklch(L C H)` from its parts, rounded as the themes write them, the lightness kept within 0 to 1. */
const oklch = ([lightness, chroma, hue]: Lch) =>
  `oklch(${round(unit(lightness), 3)} ${round(Math.max(0, chroma), 3)} ${round(hue, 1)})`;

const token = (light: string, dark: string): ColorToken => ({
  light,
  dark,
  hexLight: oklchToHex(light),
  hexDark: oklchToHex(dark),
});

/** The oklch lightness, chroma and hue of an opaque `#RRGGBB`. */
function lchOfHex(hex: string): Lch {
  const [lightness, a, b] = srgbToOklab(
    [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)) as [number, number, number],
  );
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return [round(lightness, 3), round(Math.hypot(a, b), 3), round((hue + 360) % 360, 1)];
}

/** The oklch lightness of a theme colour: as written when it is oklch, else from its hex. */
function lightnessOf(css: string, hex: string): number {
  const match = OKLCH_LIGHTNESS.exec(css.trim());
  return match ? Number(match[1]) : lchOfHex(hex.slice(0, 7))[0];
}

/** The accent in each scheme, as given, with its oklch parts. */
function accentOf(
  base: Theme,
  accent: { readonly hue: number; readonly chroma: number } | string,
): Record<"light" | "dark", { readonly css: string; readonly hex: string; readonly lch: Lch }> {
  if (typeof accent === "string") {
    const value = accent.trim();
    const match = OKLCH.exec(value);
    let given: { css: string; hex: string; lch: Lch };
    if (match) {
      const lch = match.slice(1, 4).map(Number) as [number, number, number];
      given = { css: value, hex: oklchToHex(value), lch };
    } else if (HEX.test(value)) {
      given = { css: value, hex: value.toUpperCase(), lch: lchOfHex(value) };
    } else
      throw InvalidThemeError.create({
        themeName: base.name,
        problems: [`accent "${accent}" is not an opaque oklch(L C H) or #RRGGBB colour`],
      });
    return { light: given, dark: given };
  }
  const { hue, chroma } = accent;
  if (!(hue >= 0 && hue <= 360 && chroma >= 0 && chroma <= 0.37))
    throw InvalidThemeError.create({
      themeName: base.name,
      problems: [`accent hue ${hue} and chroma ${chroma} are outside 0 to 360 and 0 to 0.37`],
    });
  const { accent: current } = base.colors;
  const at = (lightness: number) => {
    const lch: Lch = [lightness, chroma, hue];
    const css = oklch(lch);
    return { css, hex: oklchToHex(css), lch };
  };
  return {
    light: at(lightnessOf(current.light, current.hexLight)),
    dark: at(lightnessOf(current.dark, current.hexDark)),
  };
}

/**
 * The accent family of `accent` on `base`, as a diff.
 * @param base - the theme the accent goes on; its `background`, `foreground` and (for a hue) accent lightness are read
 * @param accent - a colour kept as given in both schemes, or a hue (0 to 360) and chroma (0 to 0.37) at the base
 *   accent's lightness
 * @param options - `link: true` points the link at the accent too
 * @returns the changed accent, accent-foreground, focus (and link) roles and the four accent palette steps
 * @throws InvalidThemeError when the accent is not a colour this function reads
 */
export function deriveAccent(
  base: Theme,
  accent: { readonly hue: number; readonly chroma: number } | string,
  options: { readonly link?: boolean } = {},
): ThemeDiff {
  const given = accentOf(base, accent);
  const { background } = base.colors;
  const page = {
    light: lightnessOf(background.light, background.hexLight),
    dark: lightnessOf(background.dark, background.hexDark),
  };
  const step = (mode: "light" | "dark", lightness: number, chromaShare = 1) => {
    const [, chroma, hue] = given[mode].lch;
    return oklch([lightness, chroma * chromaShare, hue]);
  };
  const [lightL, darkL] = [given.light.lch[0], given.dark.lch[0]];
  const accentToken: ColorToken = {
    light: given.light.css,
    dark: given.dark.css,
    hexLight: given.light.hex,
    hexDark: given.dark.hex,
  };
  /** The base's background or foreground in `mode`, whichever stands further from the accent. */
  const label = (mode: "light" | "dark") => {
    const { foreground } = base.colors;
    const [ground, ink] =
      mode === "light"
        ? [background.hexLight, foreground.hexLight]
        : [background.hexDark, foreground.hexDark];
    const accentHex = given[mode].hex;
    const useGround = contrastRatio(ground, accentHex) >= contrastRatio(ink, accentHex);
    return {
      css: (useGround ? background : foreground)[mode],
      hex: useGround ? ground : ink,
    };
  };
  const [labelLight, labelDark] = [label("light"), label("dark")];
  return {
    colors: {
      accent: accentToken,
      "accent-foreground": {
        light: labelLight.css,
        dark: labelDark.css,
        hexLight: labelLight.hex,
        hexDark: labelDark.hex,
      },
      focus: accentToken,
      ...(options.link ? { link: accentToken } : {}),
    },
    palette: {
      "accent-hover": token(step("light", lightL - 0.05), step("dark", darkL - 0.05)),
      "accent-pressed": token(step("light", lightL - 0.1), step("dark", darkL - 0.1)),
      "accent-soft": token(
        step("light", page.light - 0.03, 0.25),
        step("dark", page.dark + 0.13, 0.45),
      ),
      "accent-soft-foreground": token(
        step("light", lightL - 0.08),
        step("dark", darkL + 0.13, 0.64),
      ),
    },
  };
}
