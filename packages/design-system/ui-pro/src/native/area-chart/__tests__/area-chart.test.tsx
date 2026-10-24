/**
 * Stackra file contract:
 * Purpose: proves the native AreaChart is HeroUI Native Pro's own AreaChart, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/area-chart` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { AreaChart as HeroAreaChart } from "heroui-native-pro/area-chart";

import { AreaChart } from "#native/area-chart/area-chart";

vi.mock("heroui-native-pro/area-chart", () => ({
  AreaChart: Object.assign(() => null, { Part: () => null }),
}));

describe("AreaChart (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(AreaChart).toBe(HeroAreaChart);
    expect(AreaChart).toHaveProperty("Part");
  });
});
