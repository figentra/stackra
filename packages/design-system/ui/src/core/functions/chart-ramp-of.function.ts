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
  const reach = CHART_RAMP.steps[4] - CHART_RAMP.steps[0];
  // As on the web: a band narrower than the steps' reach scales them to fit, spread evenly; then the centre is
  // clamped (CSS clamp: the lower bound wins when they cross), so the steps never merge.
  const scale = Math.min(1, (high - low) / reach);
  const half = (reach / 2) * scale;
  const centre = Math.max(low + half, Math.min(lightness, high - half));
  return CHART_RAMP.steps.map((step) =>
    oklchToHex(`oklch(${(centre + step * scale).toFixed(4)} ${chroma.toFixed(4)} ${hue.toFixed(2)})`),
  );
}
