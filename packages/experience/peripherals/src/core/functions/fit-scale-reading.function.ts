/**
 * Stackra file contract:
 * Purpose: `fitScaleReading`, a scale reading put through the device's scale preset (`PeripheralsConfig.scalePreset`):
 *          the weight rounded to the preset's division (whole grams, or 0.01 g on the `precision` preset), or null when
 *          it is below zero or over the preset's capacity, so a till never charges for a weight the scale cannot read.
 * Boundary: pure. The preset is configuration; a `scalePreset` naming no entry of `scalePresets` is a configuration
 *           error and throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: presets are profiles); ADR 0449 (decision 3).
 */
import type { PeripheralsConfig } from "#config/peripherals.config";
import type { ScaleReading } from "#contracts/types/scale-reading.type";

/**
 * The reading rounded to the preset's division, or null outside its range.
 *
 * @example
 * fitScaleReading({ grams: 12.3449, isStable: true }, config); // { grams: 12.34, isStable: true } on `precision`
 * @throws RangeError when `scalePreset` names no entry of `scalePresets`.
 */
export function fitScaleReading(
  reading: ScaleReading,
  config: Pick<PeripheralsConfig, "scalePreset" | "scalePresets">,
): ScaleReading | null {
  const preset = config.scalePresets[config.scalePreset];
  if (preset === undefined)
    throw new RangeError(`scalePreset ${config.scalePreset} names no entry of scalePresets`);
  if (reading.grams < 0 || reading.grams > preset.capacity) return null;
  // Round in whole steps, then to the division's decimals, so 0.01 × 1234 reads 12.34, not 12.340000000000002.
  const decimals = Math.max(0, Math.ceil(-Math.log10(preset.division)));
  const grams = Number(
    (Math.round(reading.grams / preset.division) * preset.division).toFixed(decimals),
  );
  return { grams, isStable: reading.isStable };
}
