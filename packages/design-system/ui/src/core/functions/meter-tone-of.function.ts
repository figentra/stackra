/**
 * Stackra file contract:
 * Purpose: `meterToneOf(value, bounds)`, the tone of a Meter by the HTML meter rule: the scale is cut at `low` and
 *          `high`; a value in the same part as `optimum` is good (success), one part away is a warning, and the far
 *          part is danger.
 * Boundary: pure; `low` and `high` default to the ends, `optimum` to the middle, and each is clamped into the scale.
 * Runtime: isomorphic
 * Governing contract: HTML Living Standard, the meter element; ADR 0302 (decision 3); STA-1371 (wave A).
 */

/** `at` kept between `from` and `to`. */
const clamp = (at: number, from: number, to: number) => Math.min(to, Math.max(from, at));

/** The meter's tone. */
export function meterToneOf(
  value: number,
  {
    minValue = 0,
    maxValue = 100,
    low,
    high,
    optimum,
  }: {
    readonly minValue?: number | undefined;
    readonly maxValue?: number | undefined;
    readonly low?: number | undefined;
    readonly high?: number | undefined;
    readonly optimum?: number | undefined;
  },
): "success" | "warning" | "danger" {
  const lowAt = clamp(low ?? minValue, minValue, maxValue);
  const highAt = clamp(high ?? maxValue, lowAt, maxValue);
  const best = clamp(optimum ?? (minValue + maxValue) / 2, minValue, maxValue);
  const part = (at: number) => (at < lowAt ? 0 : at > highAt ? 2 : 1);
  const distance = Math.abs(part(clamp(value, minValue, maxValue)) - part(best));
  return distance === 0 ? "success" : distance === 1 ? "warning" : "danger";
}
