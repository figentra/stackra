/**
 * Stackra file contract:
 * Purpose: proves the native PieChart renders HeroUI Native Pro's own PieChart and parts, `Slice` and
 *          `SliceAngularInset` with the theme's reveal-step `animate` unless the caller passes one, and `Pie` and
 *          `Label` unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/pie-chart` subpath is replaced by
 *           a recording stand-in, and each copy is called as a function to read the element it returns.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
// @covers sta-430:FR-006
import { PieChart as HeroPieChart } from "heroui-native-pro/pie-chart";
import type { ReactElement } from "react";

import { PieChart } from "#native/pie-chart/pie-chart";

vi.mock("heroui-native-pro/pie-chart", () => ({
  PieChart: Object.assign(() => null, {
    Pie: () => null,
    Slice: () => null,
    SliceAngularInset: () => null,
    Label: () => null,
  }),
}));

/** The element a copy returns for `props`. */
function render(copy: unknown, props: object): ReactElement<Record<string, unknown>> {
  return (copy as (props: object) => ReactElement<Record<string, unknown>>)(props);
}

describe("PieChart (native)", () => {
  it("renders HeroUI Native Pro's own root, with Pie and Label unchanged", () => {
    expect(render(PieChart, { data: [] }).type).toBe(HeroPieChart);
    expect(PieChart.Pie).toBe(HeroPieChart.Pie);
    expect(PieChart.Label).toBe(HeroPieChart.Label);
  });

  it.each(["Slice", "SliceAngularInset"] as const)(
    "animates %s to new data on the reveal step",
    (name) => {
      const element = render(PieChart[name], {});
      expect(element.type).toBe(HeroPieChart[name]);
      expect(element.props["animate"]).toEqual({ type: "timing", duration: 400 });
    },
  );

  it("lets the caller's animate win", () => {
    const own = { type: "timing", duration: 100 };
    expect(render(PieChart.Slice, { animate: own }).props["animate"]).toBe(own);
  });
});
