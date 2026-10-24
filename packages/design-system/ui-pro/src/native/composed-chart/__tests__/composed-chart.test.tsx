/**
 * Stackra file contract:
 * Purpose: proves the native ComposedChart is HeroUI Native Pro's own ComposedChart, so every prop and part reaches it unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/composed-chart` subpath is replaced by a recording
 *          stand-in; the wrapper adds nothing, so the check is that what the app imports is what HeroUI Native Pro exports.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
import { ComposedChart as HeroComposedChart } from "heroui-native-pro/composed-chart";

import { ComposedChart } from "#native/composed-chart/composed-chart";

vi.mock("heroui-native-pro/composed-chart", () => ({
  ComposedChart: Object.assign(() => null, { Part: () => null }),
}));

describe("ComposedChart (native)", () => {
  it("is HeroUI Native Pro's own component, with its parts", () => {
    expect(ComposedChart).toBe(HeroComposedChart);
    expect(ComposedChart).toHaveProperty("Part");
  });
});
