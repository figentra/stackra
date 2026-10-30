/**
 * Stackra file contract:
 * Purpose: the hover step of each solid status colour (success, warning, danger), per scheme: 0.05 of oklch lightness
 *          away from its own label, at its chroma and hue. HeroUI's default hover mixes a tenth of the label into the
 *          fill, which moves it towards the label and costs contrast (a dark scheme's light danger under dark text
 *          fell under 4.5:1); stepping away keeps the hover at least as readable as the fill.
 * Boundary: pure; returns a palette-only diff for `mergeTheme`. A step that leaves 0 to 1 stops at the edge.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4); WCAG 2.2 (1.4.3).
 */
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";
import { srgbToOklab } from "#core/functions/srgb-to-oklab.function";

const STATUS = ["success", "warning", "danger"] as const;

const round = (number: number, digits: number) => Number(number.toFixed(digits));

/** `fillHex` 0.05 lighter (under a dark label) or darker (under a light one), as `oklch(L C H)`. */
function hoverOf(fillHex: string, labelHex: string): string {
  const [lightness, a, b] = srgbToOklab(
    [1, 3, 5].map((at) => Number.parseInt(fillHex.slice(at, at + 2), 16)) as [
      number,
      number,
      number,
    ],
  );
  const direction = contrastRatio(labelHex, "#FFFFFF") > contrastRatio(fillHex, "#FFFFFF") ? 1 : -1;
  const hue = round(((Math.atan2(b, a) * 180) / Math.PI + 360) % 360, 1);
  return `oklch(${round(Math.min(1, Math.max(0, lightness + direction * 0.05)), 3)} ${round(Math.hypot(a, b), 3)} ${hue})`;
}

/**
 * The `<status>-hover` palette steps of `theme`.
 * @param theme - the theme whose status colours and their foregrounds are read
 * @returns a diff holding `success-hover`, `warning-hover` and `danger-hover`
 */
export function deriveStatusSteps(theme: Theme): ThemeDiff {
  const palette: Record<string, ColorToken> = {};
  for (const role of STATUS) {
    const [fill, label] = [theme.colors[role], theme.colors[`${role}-foreground`]];
    const [light, dark] = [
      hoverOf(fill.hexLight.slice(0, 7), label.hexLight.slice(0, 7)),
      hoverOf(fill.hexDark.slice(0, 7), label.hexDark.slice(0, 7)),
    ];
    palette[`${role}-hover`] = {
      light,
      dark,
      hexLight: oklchToHex(light),
      hexDark: oklchToHex(dark),
    };
  }
  return { palette };
}
