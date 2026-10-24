/**
 * Stackra file contract:
 * Purpose: proves the native PieChart is HeroUI Native Pro's own PieChart, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/pie-chart` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { PieChart as HeroPieChart } from "heroui-native-pro/pie-chart";

import { PieChart } from "#native/pie-chart/pie-chart";

vi.mock("heroui-native-pro/pie-chart", () => ({
  PieChart: Object.assign(() => null, { Part: () => null }),
}));

describe("PieChart (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(PieChart).toBe(HeroPieChart);
    expect(PieChart).toHaveProperty("Part");
  });
});
