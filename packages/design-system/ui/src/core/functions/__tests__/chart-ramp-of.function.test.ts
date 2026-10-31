/**
 * Stackra file contract:
 * Purpose: proves `chartRampOf` keeps the accent itself as the middle step (ADR 0501), orders the steps darkest to
 *          lightest, keeps the accent's hue, fits an in-band accent's steps in the scheme's bounds and keeps an
 *          accent near a bound's five steps apart.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
import { CHART_RAMP, oklchToHex, srgbToOklab } from "@stackra/tokens";

import { chartRampOf } from "#core/functions/chart-ramp-of.function";

/** A hex colour as sRGB bytes. */
const bytes = (hex: string) =>
  [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)) as [number, number, number];

/** An Oklab colour's hue in degrees. */
const hueOf = ([, a, b]: number[]) => (Math.atan2(b ?? 0, a ?? 0) * 180) / Math.PI;

describe("chartRampOf", () => {
  it("steps the accent's lightness within the scheme's bounds, darkest first, hue kept", () => {
    const accent: [number, number, number] = [80, 110, 170];
    const ramp = chartRampOf(accent, "light").map((hex) => srgbToOklab(bytes(hex)));
    const lightness = ramp.map(([value]) => value);
    expect(lightness).toEqual([...lightness].sort((x, y) => x - y));
    const [low, high] = CHART_RAMP.bounds.light;
    for (const value of lightness) {
      expect(value).toBeGreaterThanOrEqual(low - 0.02);
      // The minimum step may carry the outer step a little past a bound the accent sits near.
      expect(value).toBeLessThanOrEqual(high + CHART_RAMP.minimumStep);
    }
    // Within two degrees: the darkest step rounds to sRGB bytes near the gamut edge.
    expect(Math.abs(hueOf(ramp[0] ?? []) - hueOf(srgbToOklab(accent)))).toBeLessThan(2);
  });

  it("puts the accent itself at the centre, in each scheme", () => {
    for (const scheme of ["light", "dark"] as const) {
      const accent = bytes(oklchToHex("oklch(0.55 0.1 250)"));
      const ramp = chartRampOf(accent, scheme).map((hex) => srgbToOklab(bytes(hex))[0]);
      expect(ramp[2]).toBeCloseTo(srgbToOklab(accent)[0], 2);
    }
  });

  it.each([
    ["a near-black accent", 0.15],
    ["a near-white accent", 0.95],
  ])("keeps %s at the centre, the steps in order inside the colour space", (_, accentLightness) => {
    for (const scheme of ["light", "dark"] as const) {
      const accent = bytes(oklchToHex(`oklch(${accentLightness} 0.05 60)`));
      const lightness = chartRampOf(accent, scheme).map((hex) => srgbToOklab(bytes(hex))[0]);
      expect(lightness[2]).toBeCloseTo(srgbToOklab(accent)[0], 2);
      for (let index = 1; index < lightness.length; index += 1)
        expect(lightness[index] ?? 0).toBeGreaterThanOrEqual((lightness[index - 1] ?? 0) - 0.005);
      // The side with room keeps its steps apart.
      const roomy = accentLightness < 0.5 ? lightness.slice(2) : lightness.slice(0, 3);
      for (let index = 1; index < roomy.length; index += 1)
        expect((roomy[index] ?? 0) - (roomy[index - 1] ?? 0)).toBeGreaterThan(0.04);
    }
  });
});
