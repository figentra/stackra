/**
 * Stackra file contract:
 * Purpose: ADR 0340 decision 5, the old engine's separation rule: a subject colour (an accent) stands apart from each
 *          neighbour by at least 25 degrees of oklch hue or 0.1 of lightness, in both schemes, the hue wrapping round.
 *          The hue test is skipped when either colour is near grey (chroma under 0.03), where hue means nothing.
 * Boundary: pure; it measures the painted colours and finds `accent_not_separated`, which is a notice: the caller
 *           accepts the theme and asks for every status to carry an icon and a label.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 5).
 */
import type { SeparationRule } from "#contracts/types/separation-rule.type";
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeFinding } from "#contracts/types/theme-finding.type";
import { paintedColour } from "#core/functions/painted-colour.function";
import { srgbToOklab } from "#core/functions/srgb-to-oklab.function";

const MODES = ["light", "dark"] as const;
const GREY_CHROMA = 0.03;

/** The oklch lightness, chroma and hue (degrees) of a painted name, or undefined when nothing paints it. */
function lch(theme: Theme, name: string, mode: "light" | "dark") {
  const colour = paintedColour(theme, name, mode);
  if (!colour) return undefined;
  const [lightness, a, b] = srgbToOklab(colour.rgb);
  return {
    lightness,
    chroma: Math.hypot(a, b),
    hue: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  };
}

/**
 * Measures each rule's subject against its neighbours in both schemes.
 * @param theme - the theme whose stylesheet is loaded
 * @param rules - the policy's separation rules
 * @returns one notice per subject, neighbour and scheme that stand too close; empty when all stand apart
 */
export function checkSeparation(theme: Theme, rules: readonly SeparationRule[]): ThemeFinding[] {
  const findings: ThemeFinding[] = [];
  for (const rule of rules)
    for (const neighbour of rule.from)
      for (const mode of MODES) {
        const [subject, other] = [lch(theme, rule.subject, mode), lch(theme, neighbour, mode)];
        if (!subject || !other) continue;
        const minHue = rule.minHue ?? 25;
        const minLightness = rule.minLightness ?? 0.1;
        const turn = Math.abs(subject.hue - other.hue) % 360;
        const hueDelta = Math.min(turn, 360 - turn);
        const lightnessDelta = Math.abs(subject.lightness - other.lightness);
        const hueCounts = subject.chroma >= GREY_CHROMA && other.chroma >= GREY_CHROMA;
        if ((hueCounts && hueDelta >= minHue) || lightnessDelta >= minLightness) continue;
        findings.push({
          code: "accent_not_separated",
          layer: theme.name,
          path: rule.subject,
          mode,
          detail: `${rule.subject} stands ${hueCounts ? `${hueDelta.toFixed(0)} degrees of hue and ` : ""}${lightnessDelta.toFixed(2)} of lightness from ${neighbour} in ${mode}; show every status with an icon and a label`,
        });
      }
  return findings;
}
