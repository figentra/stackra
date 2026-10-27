/**
 * Stackra file contract:
 * Purpose: unit tests of `fitScaleReading`: a reading rounds to the selected preset's division (whole grams on
 *          `retail`, 0.01 g on `precision`, with no float noise), a reading below zero or over capacity is null, and a
 *          preset name with no entry throws.
 * Boundary: test only; the shipped presets from `PeripheralsConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0253 (decision 4); ADR 0449 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { PeripheralsConfig } from "#config/peripherals.config";
import { fitScaleReading } from "#core/functions/fit-scale-reading.function";

describe("fitScaleReading", () => {
  it("rounds to whole grams on the retail preset", () => {
    const config = buildConfig(PeripheralsConfig);
    expect(fitScaleReading({ grams: 1250.4, isStable: true }, config)).toEqual({
      grams: 1250,
      isStable: true,
    });
    expect(fitScaleReading({ grams: 15_001, isStable: true }, config)).toBeNull();
    expect(fitScaleReading({ grams: -1, isStable: false }, config)).toBeNull();
  });

  it("reads hundredths of a gram on the precision preset, up to 600 g", () => {
    const config = buildConfig(PeripheralsConfig, { values: { scalePreset: "precision" } });
    expect(fitScaleReading({ grams: 12.3449, isStable: false }, config)).toEqual({
      grams: 12.34,
      isStable: false,
    });
    expect(fitScaleReading({ grams: 0.07, isStable: true }, config)?.grams).toBe(0.07);
    expect(fitScaleReading({ grams: 600.01, isStable: true }, config)).toBeNull();
  });

  it("throws on a preset name with no entry", () => {
    expect(() =>
      fitScaleReading({ grams: 1, isStable: true }, { scalePreset: "gold", scalePresets: {} }),
    ).toThrow(RangeError);
  });
});
