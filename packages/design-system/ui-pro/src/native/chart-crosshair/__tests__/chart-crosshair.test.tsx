/**
 * Stackra file contract:
 * Purpose: proves the native ChartCrosshair is HeroUI Native Pro's own ChartCrosshair, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/chart-crosshair` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { ChartCrosshair as HeroChartCrosshair } from "heroui-native-pro/chart-crosshair";

import { ChartCrosshair } from "#native/chart-crosshair/chart-crosshair";

vi.mock("heroui-native-pro/chart-crosshair", () => ({
  ChartCrosshair: Object.assign(() => null, { Part: () => null }),
}));

describe("ChartCrosshair (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(ChartCrosshair).toBe(HeroChartCrosshair);
    expect(ChartCrosshair).toHaveProperty("Part");
  });
});
