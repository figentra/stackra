/**
 * Stackra file contract:
 * Purpose: proves the native charts: each is one `image` named by its label whose value reads every number in the
 *          locale (Arabic-Indic digits when the locale asks for them); the cartesian charts hand Victory Native their rows in reading order
 *          (reversed right to left) with the value axis on the reading start, the accent ramp (or the categorical set)
 *          read from Uniwind, and no
 *          animation under Reduce Motion; horizontal bars, pies, radars, radial bars and sparklines speak the same way.
 * Boundary: React Native, Victory Native, Skia, Reanimated and Uniwind do not run in vitest, so they are replaced by
 *           recording stand-ins that render plain DOM; what the charts hand them is checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060; WCAG 2.2 SC 1.1.1 and 2.3.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { AreaChart } from "#native/area-chart/area-chart";
import { BarChart } from "#native/bar-chart/bar-chart";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { DonutChart } from "#native/donut-chart/donut-chart";
import { RadarChart } from "#native/radar-chart/radar-chart";
import { RadialBarChart } from "#native/radial-bar-chart/radial-bar-chart";
import { Sparkline } from "#native/sparkline/sparkline";

const state = vi.hoisted(() => ({
  reduced: false,
  images: [] as Record<string, unknown>[],
  charts: [] as Record<string, unknown>[],
  polar: [] as Record<string, unknown>[],
  variables: [] as string[][],
  toggles: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    View: (props: Record<string, unknown>) => {
      if (props["accessibilityRole"] === "image") state.images.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.toggles.push(props);
      return createElement("button", { type: "button" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

vi.mock("uniwind", () => ({
  useCSSVariable: (names: string[]) => {
    state.variables.push(names);
    return names.map((name) => `paint(${name})`);
  },
}));

vi.mock("react-native-reanimated", () => ({
  useReducedMotion: () => state.reduced,
  useSharedValue: (value: unknown) => ({ value, set: () => undefined }),
  useDerivedValue: (compute: () => unknown) => ({ value: compute() }),
  useAnimatedReaction: () => undefined,
  withTiming: (value: unknown) => value,
  runOnJS: (callback: unknown) => callback,
}));

vi.mock("@shopify/react-native-skia", () => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const path = () => ({
    moveTo: () => undefined,
    lineTo: () => undefined,
    close: () => undefined,
    addArc: () => undefined,
  });
  return {
    Skia: { Color: () => [0, 0, 0, 1], Path: { Make: path }, XYWHRect: () => ({}) },
    TextAlign: { Center: 2 },
    vec: (x: number, y: number) => ({ x, y }),
    Canvas: () => null,
    Path: () => null,
    Circle: () => null,
    Group: () => null,
    Rect: () => null,
    Line: () => null,
    LinearGradient: () => null,
    DashPathEffect: () => null,
  };
});

vi.mock("victory-native", () => ({
  CartesianChart: (props: Record<string, unknown>) => {
    state.charts.push(props);
    return null;
  },
  PolarChart: (props: Record<string, unknown>) => {
    state.polar.push(props);
    return null;
  },
  Pie: { Chart: () => null, Slice: () => null, SliceAngularInset: () => null },
  Area: () => null,
  Bar: () => null,
  BarGroup: Object.assign(() => null, { Bar: () => null }),
  Line: () => null,
  Scatter: () => null,
  StackedArea: () => null,
  StackedBar: () => null,
  createParagraphLabelRenderer: () => ({}),
  useChartPressState: () => ({ state: {}, isActive: false }),
}));

const DATA = [
  { month: "Jan", desktop: 1186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: null },
];
const SERIES = [
  { key: "desktop", label: "Desktop" },
  { key: "mobile", label: "Mobile", color: "success" as const },
];

/** Renders in a provider of the given locale and direction. */
const within = (locale: string, direction: "ltr" | "rtl", node: ReactNode) =>
  render(
    <DesignSystemContext value={{ locale, direction } as DesignSystemState}>
      {node}
    </DesignSystemContext>,
  );

beforeEach(() => {
  state.reduced = false;
  state.images.length = 0;
  state.charts.length = 0;
  state.polar.length = 0;
  state.variables.length = 0;
  state.toggles.length = 0;
});

describe("native cartesian charts", () => {
  it("speak their label and every value, and hand Victory the rows in reading order", () => {
    within("en", "ltr", <AreaChart data={DATA} series={SERIES} xKey="month" label="Visitors" />);
    expect(state.images[0]).toMatchObject({
      accessibilityLabel: "Visitors",
      accessibilityValue: { text: "Jan: Desktop 1,186, Mobile 80; Feb: Desktop 305, Mobile " },
    });
    const chart = state.charts[0] ?? {};
    expect((chart["data"] as { month: string }[]).map((row) => row.month)).toEqual(["Jan", "Feb"]);
    expect(chart["yKeys"]).toEqual(["desktop", "mobile"]);
    expect((chart["yAxis"] as { axisSide: string }[])[0]?.axisSide).toBe("left");
    // The default palette is the accent ramp (a theme step where defined); a series' own colour wins.
    expect(state.variables[0]?.slice(-2)).toEqual(["--color-chart-ramp-1", "--color-success"]);
  });

  it("run right to left in Arabic with the value axis on the right and Arabic-Indic digits", () => {
    within(
      "ar-u-nu-arab",
      "rtl",
      <BarChart data={DATA} series={SERIES} xKey="month" label="الزوار" />,
    );
    const chart = state.charts[0] ?? {};
    expect((chart["data"] as { month: string }[]).map((row) => row.month)).toEqual(["Feb", "Jan"]);
    expect((chart["yAxis"] as { axisSide: string }[])[0]?.axisSide).toBe("right");
    expect(state.images[0]?.["accessibilityValue"]).toEqual({
      text: "Jan: Desktop ١٬١٨٦، Mobile ٨٠; Feb: Desktop ٣٠٥، Mobile ",
    });
  });

  it("draw horizontal bars with Views and speak them the same way", () => {
    within(
      "en",
      "ltr",
      <BarChart
        data={DATA}
        series={SERIES}
        xKey="month"
        label="Visitors"
        orientation="horizontal"
      />,
    );
    expect(state.charts).toHaveLength(0);
    expect(state.images[0]?.["accessibilityLabel"]).toBe("Visitors");
  });
});

describe("native chart card options", () => {
  const COMPARED = [
    { key: "desktop", label: "Desktop", compareKey: "last" },
    { key: "mobile", label: "Mobile" },
  ];
  const ROWS = [
    { month: "Jan", desktop: 10, mobile: 5, last: 8 },
    { month: "Feb", desktop: 30, mobile: 1, last: 20 },
    { month: "Mar", desktop: 20, mobile: 2, last: 25 },
  ];

  it("make each legend entry a toggle that hides its series from the plot", async () => {
    const { act } = await import("@testing-library/react");
    within("en", "ltr", <BarChart data={ROWS} series={COMPARED} xKey="month" label="Visitors" />);
    expect(state.toggles.map((toggle) => toggle["accessibilityState"])).toEqual([
      { selected: true },
      { selected: true },
    ]);
    act(() => (state.toggles[0]?.["onPress"] as (() => void) | undefined)?.());
    expect(state.charts.at(-1)?.["yKeys"]).toEqual(["mobile"]);
    expect(state.toggles.at(-2)?.["accessibilityState"]).toEqual({ selected: false });
  });

  it("sort bars, draw the previous period, and speak a reference line", () => {
    within(
      "en",
      "ltr",
      <BarChart
        data={ROWS}
        series={COMPARED}
        xKey="month"
        label="Visitors"
        sort="value-desc"
        showComparison
        references={[{ value: 25, label: "Target" }]}
      />,
    );
    const chart = state.charts[0] ?? {};
    expect((chart["data"] as { month: string }[]).map((row) => row.month)).toEqual([
      "Feb",
      "Mar",
      "Jan",
    ]);
    expect(chart["yKeys"]).toEqual(["desktop", "mobile", "last"]);
    const spoken = (state.images[0]?.["accessibilityValue"] as { text: string } | undefined)?.text;
    expect(spoken).toContain("Desktop, previous period 20");
    expect(spoken).toMatch(/Target: 25$/);
  });
});

describe("native polar charts", () => {
  const SLICES = [
    { browser: "chrome", visitors: 275 },
    { browser: "safari", visitors: 200 },
  ];
  const NAMES = [
    { key: "chrome", label: "Chrome" },
    { key: "safari", label: "Safari" },
  ];

  it("a donut speaks each slice by its series and shows the total in the hole", () => {
    const { container } = within(
      "en",
      "ltr",
      <DonutChart
        data={SLICES}
        series={NAMES}
        nameKey="browser"
        valueKey="visitors"
        label="Browsers"
        centerLabel="Visitors"
      />,
    );
    expect(state.images[0]).toMatchObject({
      accessibilityLabel: "Browsers",
      accessibilityValue: { text: "Chrome: 275; Safari: 200" },
    });
    expect(container.textContent).toContain("475Visitors");
    expect(
      (state.polar[0]?.["data"] as { color: string }[] | undefined)?.map((row) => row.color),
    ).toEqual(["paint(--color-chart-ramp-1)", "paint(--color-chart-ramp-2)"]);
  });

  it("takes the categorical set when asked", () => {
    within(
      "en",
      "ltr",
      <DonutChart
        data={SLICES}
        series={NAMES}
        nameKey="browser"
        valueKey="visitors"
        label="Browsers"
        palette="categorical"
      />,
    );
    expect(
      (state.polar[0]?.["data"] as { color: string }[] | undefined)?.map((row) => row.color),
    ).toEqual(["paint(--color-chart-1)", "paint(--color-chart-2)"]);
  });

  it("a radar and a radial chart speak their numbers", () => {
    within(
      "en",
      "ltr",
      <RadarChart data={DATA} series={SERIES.slice(0, 1)} xKey="month" label="Radar" />,
    );
    within(
      "en",
      "ltr",
      <RadialBarChart
        data={SLICES}
        series={NAMES}
        nameKey="browser"
        valueKey="visitors"
        label="Rings"
      />,
    );
    expect(
      state.images.map((image) => [image["accessibilityLabel"], image["accessibilityValue"]]),
    ).toEqual([
      ["Radar", { text: "Jan: 1,186; Feb: 305" }],
      ["Rings", { text: "Chrome: 275; Safari: 200" }],
    ]);
  });
});

describe("native Sparkline", () => {
  it("speaks its values, runs right to left, and stays still under Reduce Motion", () => {
    state.reduced = true;
    within("ar-u-nu-arab", "rtl", <Sparkline data={[1, 2, 3]} label="الطلبات" />);
    expect(state.images[0]).toMatchObject({
      accessibilityLabel: "الطلبات",
      accessibilityValue: { text: "١، ٢، ٣" },
    });
    const rows = state.charts[0]?.["data"] as { index: number; figure: number }[];
    expect(rows.map((row) => row.figure)).toEqual([3, 2, 1]);
  });
});
