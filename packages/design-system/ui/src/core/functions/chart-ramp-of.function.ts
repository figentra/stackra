/**
 * Stackra file contract:
 * Purpose: `chartRampOf`, the five accent steps of the default chart palette for a runtime with no relative colours
 *          (native): the accent's OKLCH lightness moved by `CHART_RAMP.steps`, chroma and hue kept, the steps
 *          scaled to fit the scheme's band and the centre clamped, as the web does, so all five stay inside the band
 *          where a mark keeps 3:1 against the surface; series 1 darkest, series 5 lightest.
 * Boundary: pure; takes the resolved accent as sRGB bytes and returns hex colours. The web derives the same steps in
 *           CSS with `oklch(from var(--accent) ...)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same colours on web and native); ADR 0340 (decision 9); STA-1371.
 */
import { CHART_RAMP, oklchToHex, srgbToOklab } from "@stackra/tokens";

/**
 * The accent ramp of one scheme.
 * @param accent - the accent as sRGB bytes (0 to 255)
 * @param scheme - the scheme on screen, whose lightness bounds apply
 * @returns five hex colours, darkest first
 */
export function chartRampOf(
  accent: readonly [number, number, number],
  scheme: "light" | "dark",
): string[] {
  const [lightness, a, b] = srgbToOklab(accent);
  const chroma = Math.hypot(a, b);
  const hue = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  const [low, high] = CHART_RAMP.bounds[scheme];
  const unit = CHART_RAMP.steps[3];
  // As on the web: the centre is the accent; one step on each side is half the room left to the bound, kept between
  // the minimum step (so the five stay apart) and the full move.
  return CHART_RAMP.steps.map((step) => {
    const room = step < 0 ? lightness - low : high - lightness;
    const move = Math.min(unit, Math.max(CHART_RAMP.minimumStep, room / 2));
    // Inside the colour space: a black or white accent pins its outer steps at the end.
    const at = Math.min(
      0.98,
      Math.max(0.02, lightness + Math.sign(step) * move * Math.round(Math.abs(step) / unit)),
    );
    return oklchToHex(`oklch(${at.toFixed(4)} ${chroma.toFixed(4)} ${hue.toFixed(2)})`);
  });
}
