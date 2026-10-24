/**
 * Stackra file contract:
 * Purpose: proves the native BarChart renders HeroUI Native Pro's own BarChart and parts, `Bar` and `StackedBar` with
 *          the theme's reveal-step `animate` unless the caller passes one, and every other part (`BarGroup`,
 *          `BarGroupItem`) unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/bar-chart` subpath is replaced by
 *           a recording stand-in, and each copy is called as a function to read the element it returns.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
// @covers sta-430:FR-006
import { BarChart as HeroBarChart } from "heroui-native-pro/bar-chart";
import type { ReactElement } from "react";

import { BarChart } from "#native/bar-chart/bar-chart";

vi.mock("heroui-native-pro/bar-chart", () => ({
  BarChart: Object.assign(() => null, {
    Bar: () => null,
    BarGroup: () => null,
    BarGroupItem: () => null,
    StackedBar: () => null,
  }),
}));

/** The element a copy returns for `props`. */
function render(copy: unknown, props: object): ReactElement<Record<string, unknown>> {
  return (copy as (props: object) => ReactElement<Record<string, unknown>>)(props);
}

describe("BarChart (native)", () => {
  it("renders HeroUI Native Pro's own root, with its group parts unchanged", () => {
    expect(render(BarChart, { data: [] }).type).toBe(HeroBarChart);
    expect(BarChart.BarGroup).toBe(HeroBarChart.BarGroup);
    expect(BarChart.BarGroupItem).toBe(HeroBarChart.BarGroupItem);
  });

  it.each(["Bar", "StackedBar"] as const)("animates %s to new data on the reveal step", (name) => {
    const element = render(BarChart[name], { points: [] });
    expect(element.type).toBe(HeroBarChart[name]);
    expect(element.props["animate"]).toEqual({ type: "timing", duration: 400 });
  });

  it("lets the caller's animate win", () => {
    const own = { type: "timing", duration: 100 };
    expect(render(BarChart.Bar, { points: [], animate: own }).props["animate"]).toBe(own);
  });
});
