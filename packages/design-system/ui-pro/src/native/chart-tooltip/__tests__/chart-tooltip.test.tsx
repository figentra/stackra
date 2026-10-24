/**
 * Stackra file contract:
 * Purpose: proves the native ChartTooltip is HeroUI Native Pro's own ChartTooltip, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/chart-tooltip` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { ChartTooltip as HeroChartTooltip } from "heroui-native-pro/chart-tooltip";

import { ChartTooltip } from "#native/chart-tooltip/chart-tooltip";

vi.mock("heroui-native-pro/chart-tooltip", () => ({
  ChartTooltip: Object.assign(() => null, { Part: () => null }),
}));

describe("ChartTooltip (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(ChartTooltip).toBe(HeroChartTooltip);
    expect(ChartTooltip).toHaveProperty("Part");
  });
});
