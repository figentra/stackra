/**
 * Stackra file contract:
 * Purpose: proves the native AreaChart renders HeroUI Native Pro's own AreaChart and parts, its series (`Area`,
 *          `StackedArea`, `AreaRange`) with the theme's reveal-step `animate` unless the caller passes one, and every
 *          other part unchanged.
 * Boundary: React Native and Skia do not render in vitest, so the `heroui-native-pro/area-chart` subpath is replaced by
 *           a recording stand-in, and each copy is called as a function to read the element it returns.
 * Runtime: node
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-416:FR-006
// @covers sta-430:FR-006
import { AreaChart as HeroAreaChart } from "heroui-native-pro/area-chart";
import type { ReactElement } from "react";

import { AreaChart } from "#native/area-chart/area-chart";

vi.mock("heroui-native-pro/area-chart", () => ({
  AreaChart: Object.assign(() => null, {
    Area: () => null,
    StackedArea: () => null,
    AreaRange: () => null,
    Part: () => null,
  }),
}));

/** The element a copy returns for `props`. */
function render(copy: unknown, props: object): ReactElement<Record<string, unknown>> {
  return (copy as (props: object) => ReactElement<Record<string, unknown>>)(props);
}

const SERIES = ["Area", "StackedArea", "AreaRange"] as const;

describe("AreaChart (native)", () => {
  it("renders HeroUI Native Pro's own root, with its other parts unchanged", () => {
    expect(render(AreaChart, { data: [] }).type).toBe(HeroAreaChart);
    expect(AreaChart).toHaveProperty("Part", (HeroAreaChart as unknown as { Part: unknown }).Part);
  });

  it.each(SERIES)("animates %s to new data on the reveal step", (name) => {
    const element = render(AreaChart[name], { points: [] });
    expect(element.type).toBe(HeroAreaChart[name]);
    expect(element.props["animate"]).toEqual({ type: "timing", duration: 400 });
  });

  it("lets the caller's animate win", () => {
    const own = { type: "timing", duration: 100 };
    expect(render(AreaChart.Area, { points: [], animate: own }).props["animate"]).toBe(own);
  });
});
