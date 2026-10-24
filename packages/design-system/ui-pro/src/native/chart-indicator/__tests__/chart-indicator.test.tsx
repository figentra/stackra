/**
 * Stackra file contract:
 * Purpose: proves the native ChartIndicator is HeroUI Native Pro's own ChartIndicator, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/chart-indicator` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { ChartIndicator as HeroChartIndicator } from "heroui-native-pro/chart-indicator";

import { ChartIndicator } from "#native/chart-indicator/chart-indicator";

vi.mock("heroui-native-pro/chart-indicator", () => ({
  ChartIndicator: Object.assign(() => null, { Part: () => null }),
}));

describe("ChartIndicator (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(ChartIndicator).toBe(HeroChartIndicator);
    expect(ChartIndicator).toHaveProperty("Part");
  });
});
