/**
 * Stackra file contract:
 * Purpose: proves the native BarChart is HeroUI Native Pro's own BarChart, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/bar-chart` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { BarChart as HeroBarChart } from "heroui-native-pro/bar-chart";

import { BarChart } from "#native/bar-chart/bar-chart";

vi.mock("heroui-native-pro/bar-chart", () => ({
  BarChart: Object.assign(() => null, { Part: () => null }),
}));

describe("BarChart (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(BarChart).toBe(HeroBarChart);
    expect(BarChart).toHaveProperty("Part");
  });
});
