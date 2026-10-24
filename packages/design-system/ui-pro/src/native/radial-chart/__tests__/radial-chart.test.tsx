/**
 * Stackra file contract:
 * Purpose: proves the native RadialChart is HeroUI Native Pro's own RadialChart, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/radial-chart` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { RadialChart as HeroRadialChart } from "heroui-native-pro/radial-chart";

import { RadialChart } from "#native/radial-chart/radial-chart";

vi.mock("heroui-native-pro/radial-chart", () => ({
  RadialChart: Object.assign(() => null, { Part: () => null }),
}));

describe("RadialChart (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(RadialChart).toBe(HeroRadialChart);
    expect(RadialChart).toHaveProperty("Part");
  });
});
