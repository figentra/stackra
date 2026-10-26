/**
 * Stackra file contract:
 * Purpose: the opt-in gate of ADR 0340 decision 3: measures a theme's contrast pairs as the components paint them, in
 *          both schemes, and finds every colour whose hex is not its oklch value. A translucent background is
 *          composited over the theme's `background` and translucent text over that, as the browser does; a colour that
 *          cannot be measured is reported, never thrown.
 * Boundary: pure; it finds and never refuses or corrects (`resolveTheme` decides). `defineTheme` keeps checking
 *           grammar only, so a framework user's theme meets these gates only through a policy.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 3 and 4); WCAG 2.2 (1.4.3, 1.4.11).
 */
import type { ContrastPair } from "#contracts/types/contrast-pair.type";
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeFinding } from "#contracts/types/theme-finding.type";
import { DEFAULT_CONTRAST_PAIRS } from "#core/constants/default-contrast-pairs.constant";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";
import { pairRatio } from "#core/functions/pair-ratio.function";

const MODES = ["light", "dark"] as const;
const OKLCH = /^oklch\(/i;

/** The hex of an oklch colour, or undefined when the value is not oklch or does not parse. */
function hexOf(value: string): string | undefined {
  if (!OKLCH.test(value)) return undefined;
  try {
    return oklchToHex(value);
  } catch {
    return undefined;
  }
}

/** A `hex_drift` finding for each scheme of `token` whose hex is not its oklch value. */
function drift(theme: Theme, path: string, token: ColorToken): ThemeFinding[] {
  return MODES.flatMap((mode) => {
    const [value, hex] =
      mode === "light" ? [token.light, token.hexLight] : [token.dark, token.hexDark];
    const expected = hexOf(value);
    if (expected === undefined || expected.toUpperCase() === hex.toUpperCase()) return [];
    const field = mode === "light" ? "hexLight" : "hexDark";
    return [
      {
        code: "hex_drift",
        layer: theme.name,
        path: `${path}.${field}`,
        mode,
        detail: `${path}.${field} is ${hex}, but ${value} paints ${expected}`,
      } satisfies ThemeFinding,
    ];
  });
}

/**
 * Measures `theme`: every pair in both schemes, and every colour's hex against its oklch value.
 * @param theme - a theme `defineTheme` accepts
 * @param pairs - the pairs to measure; the default role pairs when left out
 * @returns the findings, empty when the theme passes
 */
export function checkTheme(
  theme: Theme,
  pairs: readonly ContrastPair[] = DEFAULT_CONTRAST_PAIRS,
): ThemeFinding[] {
  const findings: ThemeFinding[] = [
    ...Object.entries(theme.colors).flatMap(([role, token]) =>
      drift(theme, `colors.${role}`, token),
    ),
    ...Object.entries(theme.palette).flatMap(([name, token]) =>
      drift(theme, `palette.${name}`, token),
    ),
  ];
  for (const pair of pairs)
    for (const mode of MODES) {
      const ratio = pairRatio(theme, pair, mode);
      if (ratio === undefined)
        findings.push({
          code: "colour_not_measurable",
          layer: theme.name,
          path: pair.fg,
          mode,
          detail: `${pair.fg} on ${pair.bg} cannot be measured in ${mode}: a colour is missing, or the page under it is translucent`,
          pair,
        });
      else if (ratio < pair.min)
        findings.push({
          code: "contrast_too_low",
          layer: theme.name,
          path: pair.fg,
          mode,
          detail: `${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1 in ${mode}, under ${pair.min}:1`,
          pair,
          ratio: Math.floor(ratio * 100) / 100,
        });
    }
  return findings;
}
