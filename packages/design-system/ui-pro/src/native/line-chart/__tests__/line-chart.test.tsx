/**
 * Stackra file contract:
 * Purpose: proves the native LineChart renders HeroUI Native Pro's own LineChart and parts, `Line` with the theme's
 *          reveal-step `animate` unless the caller passes one, and `AnimatedLine` unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/line-chart` subpath is replaced by
 *           a recording stand-in, and each copy is called as a function to read the element it returns.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
// @covers sta-430:FR-006
import { LineChart as HeroLineChart } from "heroui-native-pro/line-chart";
import type { ReactElement } from "react";

import { LineChart } from "#native/line-chart/line-chart";

vi.mock("heroui-native-pro/line-chart", () => ({
  LineChart: Object.assign(() => null, { Line: () => null, AnimatedLine: () => null }),
}));

/** The element a copy returns for `props`. */
function render(copy: unknown, props: object): ReactElement<Record<string, unknown>> {
  return (copy as (props: object) => ReactElement<Record<string, unknown>>)(props);
}

describe("LineChart (native)", () => {
  it("renders HeroUI Native Pro's own root, with AnimatedLine unchanged", () => {
    expect(render(LineChart, { data: [] }).type).toBe(HeroLineChart);
    expect(LineChart.AnimatedLine).toBe(HeroLineChart.AnimatedLine);
  });

  it("animates Line to new data on the reveal step, unless the caller passes animate", () => {
    const element = render(LineChart.Line, { points: [] });
    expect(element.type).toBe(HeroLineChart.Line);
    expect(element.props["animate"]).toEqual({ type: "timing", duration: 400 });
    const own = { type: "timing", duration: 100 };
    expect(render(LineChart.Line, { points: [], animate: own }).props["animate"]).toBe(own);
  });
});
