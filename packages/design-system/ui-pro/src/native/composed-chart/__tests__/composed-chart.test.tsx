/**
 * Stackra file contract:
 * Purpose: proves the native ComposedChart renders HeroUI Native Pro's own ComposedChart and parts, its series with
 *          the theme's reveal-step `animate` unless the caller passes one, and `BarGroup`, `BarGroupItem` and
 *          `AnimatedLine` unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/composed-chart` subpath is
 *           replaced by a recording stand-in, and each copy is called as a function to read the element it returns.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
// @covers sta-430:FR-006
import { ComposedChart as HeroComposedChart } from "heroui-native-pro/composed-chart";
import type { ReactElement } from "react";

import { ComposedChart } from "#native/composed-chart/composed-chart";

vi.mock("heroui-native-pro/composed-chart", () => ({
  ComposedChart: Object.assign(() => null, {
    Bar: () => null,
    BarGroup: () => null,
    BarGroupItem: () => null,
    StackedBar: () => null,
    Line: () => null,
    AnimatedLine: () => null,
    Area: () => null,
    StackedArea: () => null,
    AreaRange: () => null,
  }),
}));

/** The element a copy returns for `props`. */
function render(copy: unknown, props: object): ReactElement<Record<string, unknown>> {
  return (copy as (props: object) => ReactElement<Record<string, unknown>>)(props);
}

const SERIES = ["Bar", "StackedBar", "Line", "Area", "StackedArea", "AreaRange"] as const;

describe("ComposedChart (native)", () => {
  it("renders HeroUI Native Pro's own root, with its other parts unchanged", () => {
    expect(render(ComposedChart, { data: [] }).type).toBe(HeroComposedChart);
    expect(ComposedChart.BarGroup).toBe(HeroComposedChart.BarGroup);
    expect(ComposedChart.BarGroupItem).toBe(HeroComposedChart.BarGroupItem);
    expect(ComposedChart.AnimatedLine).toBe(HeroComposedChart.AnimatedLine);
  });

  it.each(SERIES)("animates %s to new data on the reveal step", (name) => {
    const element = render(ComposedChart[name], { points: [] });
    expect(element.type).toBe(HeroComposedChart[name]);
    expect(element.props["animate"]).toEqual({ type: "timing", duration: 400 });
  });

  it("lets the caller's animate win", () => {
    const own = { type: "timing", duration: 100 };
    expect(render(ComposedChart.Line, { points: [], animate: own }).props["animate"]).toBe(own);
  });
});
