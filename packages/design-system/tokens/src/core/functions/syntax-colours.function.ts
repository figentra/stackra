/**
 * Stackra file contract:
 * Purpose: `syntaxColours`, a theme's syntax palette for one scheme: each `SyntaxRole` from `SYNTAX_RECIPE`, its
 *          lightness moved away from the code background (`surface-secondary`) until it holds `SYNTAX_RECIPE.minContrast`
 *          there and on the line tints a code block paints,
 *          so every brand gets a matching palette whose keywords lean to its accent.
 * Boundary: pure; reads the theme's hex values and returns hex.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); WCAG 2.2 SC 1.4.3; STA-1371.
 */
import { SyntaxRole } from "#contracts/enums/syntax-role.enum";
import type { Theme } from "#contracts/types/theme.type";
import { SYNTAX_RECIPE } from "#core/constants/syntax-recipe.constant";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";
import { srgbToOklab } from "#core/functions/srgb-to-oklab.function";

const rgbOf = (hex: string) =>
  [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)) as [number, number, number];

/** The OKLCH hue of a `#RRGGBB` colour, in degrees. */
function hueOf(hex: string): number {
  const [, a, b] = srgbToOklab(rgbOf(hex));
  return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
}

/** `top` at `SYNTAX_RECIPE.lineTint` over `under`, as `color-mix(in srgb, top 10%, transparent)` paints on it. */
function tintOf(top: string, under: string): string {
  const below = rgbOf(under);
  return `#${rgbOf(top)
    .map((value, at) =>
      Math.round(value * SYNTAX_RECIPE.lineTint + (below[at] ?? 0) * (1 - SYNTAX_RECIPE.lineTint)),
    )
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * The syntax palette of `theme` in `mode`: the inserted and deleted roles first (their tints are backgrounds too),
 * then every role against the background and the three line tints.
 * @returns each role's `#RRGGBB`, at least `SYNTAX_RECIPE.minContrast` on the code background and its line tints
 */
export function syntaxColours(theme: Theme, mode: "light" | "dark"): Record<SyntaxRole, string> {
  const hex = (role: "surface-secondary" | "accent") =>
    (mode === "light" ? theme.colors[role].hexLight : theme.colors[role].hexDark).slice(0, 7);
  const background = hex("surface-secondary");
  const step =
    contrastRatio(background, "#000000") > contrastRatio(background, "#FFFFFF") ? -0.01 : 0.01;
  const colourOf = (role: SyntaxRole, unders: readonly string[]) => {
    const { hue, chroma, lightness } = SYNTAX_RECIPE.roles[role];
    const h = (
      typeof hue === "string" ? (hue === "accent" ? hueOf(hex("accent")) : hueOf(background)) : hue
    ).toFixed(1);
    let l: number = lightness[mode === "light" ? 0 : 1];
    let colour = oklchToHex(`oklch(${l} ${chroma} ${h})`);
    while (
      Math.min(...unders.map((under) => contrastRatio(colour, under))) <
        SYNTAX_RECIPE.minContrast &&
      l > 0 &&
      l < 1
    ) {
      l = Number((l + step).toFixed(3));
      colour = oklchToHex(`oklch(${l} ${chroma} ${h})`);
    }
    return colour;
  };
  const accentLine = tintOf(hex("accent"), background);
  const lines = [background, accentLine];
  for (const role of ["inserted", "deleted"] as const)
    lines.push(tintOf(colourOf(role, lines), background));
  return Object.fromEntries(SyntaxRole.map((role) => [role, colourOf(role, lines)])) as Record<
    SyntaxRole,
    string
  >;
}
