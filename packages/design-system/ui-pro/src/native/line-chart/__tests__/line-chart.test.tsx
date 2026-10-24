/**
 * Stackra file contract:
 * Purpose: proves the native LineChart is HeroUI Native Pro's own LineChart, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/line-chart` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { LineChart as HeroLineChart } from "heroui-native-pro/line-chart";

import { LineChart } from "#native/line-chart/line-chart";

vi.mock("heroui-native-pro/line-chart", () => ({
  LineChart: Object.assign(() => null, { Part: () => null }),
}));

describe("LineChart (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(LineChart).toBe(HeroLineChart);
    expect(LineChart).toHaveProperty("Part");
  });
});
