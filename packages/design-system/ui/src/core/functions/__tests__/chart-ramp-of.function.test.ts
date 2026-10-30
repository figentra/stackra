/**
 * Stackra file contract:
 * Purpose: proves `chartRampOf` keeps the accent as the middle step, orders the steps darkest to lightest, keeps the
 *          accent's hue, and clamps the centre so all five steps fit the scheme's bounds and stay apart.
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
      expect(value).toBeGreaterThanOrEqual(low - 0.01);
      expect(value).toBeLessThanOrEqual(high + 0.01);
    }
    // Within two degrees: the darkest step rounds to sRGB bytes near the gamut edge.
    expect(Math.abs(hueOf(ramp[0] ?? []) - hueOf(srgbToOklab(accent)))).toBeLessThan(2);
  });

  it("lifts a dark scheme's ramp into its own bounds", () => {
    const lightness = chartRampOf([20, 30, 60], "dark").map((hex) => srgbToOklab(bytes(hex))[0]);
    expect(Math.min(...lightness)).toBeGreaterThanOrEqual(CHART_RAMP.bounds.dark[0] - 0.01);
    // The centre is clamped, not each step, so the five stay apart.
    expect(new Set(lightness.map((value) => value.toFixed(2))).size).toBe(5);
  });

  it.each([
    ["a near-black accent", 0.15],
    ["a near-white accent", 0.95],
  ])("keeps %s's five steps 0.08 apart inside each scheme's band", (_, accentLightness) => {
    for (const scheme of ["light", "dark"] as const) {
      const accent = bytes(oklchToHex(`oklch(${accentLightness} 0.05 60)`));
      const lightness = chartRampOf(accent, scheme).map((hex) => srgbToOklab(bytes(hex))[0]);
      const [low, high] = CHART_RAMP.bounds[scheme];
      for (const value of lightness) {
        expect(value).toBeGreaterThanOrEqual(low - 0.01);
        expect(value).toBeLessThanOrEqual(high + 0.01);
      }
      for (let index = 1; index < lightness.length; index += 1)
        expect((lightness[index] ?? 0) - (lightness[index - 1] ?? 0)).toBeGreaterThanOrEqual(0.08);
    }
  });
});
