/**
 * Stackra file contract:
 * Purpose: `toGrams`, a weight in a scale's display unit converted to grams (`g`, `mg`, `kg`, `t`, `lb`, `oz`, `ct`),
 *          or null for a unit with no gram value (pieces, percent) or one this package does not know.
 * Boundary: pure. Exact factors (the international pound and ounce, the metric carat); the result is rounded to
 *           0.0001 g so a converted reading carries no float noise. Units are matched case-insensitively.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (`ScaleReading` is grams whatever the display unit); ADR 0478 (decision 5).
 */

/** Grams per unit. */
const GRAMS_PER_UNIT: Readonly<Record<string, number>> = Object.freeze({
  g: 1,
  mg: 0.001,
  kg: 1000,
  t: 1_000_000,
  lb: 453.59237,
  oz: 28.349523125,
  ct: 0.2,
});

/**
 * The weight in grams, or null for an unknown unit.
 *
 * @example
 * toGrams(1.25, "kg"); // 1250
 * toGrams(12, "PCS"); // null
 */
export function toGrams(value: number, unit: string): number | null {
  const factor = GRAMS_PER_UNIT[unit.toLowerCase()];
  if (factor === undefined || !Number.isFinite(value)) return null;
  return Math.round(value * factor * 10_000) / 10_000;
}
