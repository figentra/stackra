/**
 * Stackra file contract:
 * Purpose: proves the native RadarChart is HeroUI Native Pro's own RadarChart, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/radar-chart` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { RadarChart as HeroRadarChart } from "heroui-native-pro/radar-chart";

import { RadarChart } from "#native/radar-chart/radar-chart";

vi.mock("heroui-native-pro/radar-chart", () => ({
  RadarChart: Object.assign(() => null, { Part: () => null }),
}));

describe("RadarChart (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(RadarChart).toBe(HeroRadarChart);
    expect(RadarChart).toHaveProperty("Part");
  });
});
