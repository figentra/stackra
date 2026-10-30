/**
 * Stackra file contract:
 * Purpose: proves what the native charts draw inside Victory's plot: area, line and column charts draw their series,
 *          stacks (rounded only at the top, 100% stacks as shares), previous-period twins, reference lines and
 *          bands, and the press cursor with a readout of the pressed row; the composed, candlestick, waterfall and
 *          scatter charts draw their marks and readouts; the radar, radial and pie charts draw on their canvas once
 *          laid out; the sparkline draws a line, area or columns.
 * Boundary: Victory Native, Skia, Reanimated, Uniwind and React Native do not run in vitest, so they are recording
 *           stand-ins: the chart stand-in calls the plot's render function with fixed points, and the mark stand-ins
 *           record their props and call their option callbacks; what the charts hand them is checked, not the pixels.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303; ADR 0060; WCAG 2.2 SC 1.1.1 and 2.3.3; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { AreaChart } from "#native/area-chart/area-chart";
import { BarChart } from "#native/bar-chart/bar-chart";
import { CandlestickChart } from "#native/candlestick-chart/candlestick-chart";
import { ComposedChart } from "#native/composed-chart/composed-chart";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { DonutChart } from "#native/donut-chart/donut-chart";
import { LineChart } from "#native/line-chart/line-chart";
import { PieChart } from "#native/pie-chart/pie-chart";
import { RadarChart } from "#native/radar-chart/radar-chart";
import { RadialBarChart } from "#native/radial-bar-chart/radial-bar-chart";
import { ScatterChart } from "#native/scatter-chart/scatter-chart";
import { Sparkline } from "#native/sparkline/sparkline";
import { WaterfallChart } from "#native/waterfall-chart/waterfall-chart";

const state = vi.hoisted(() => ({
  reduced: false,
  active: false,
  index: 0,
  views: [] as Record<string, unknown>[],
  charts: [] as Record<string, unknown>[],
  marks: [] as { name: string; props: Record<string, unknown> }[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));
vi.mock("heroui-native", () => ({ useThemeColor: () => "surface" }));
vi.mock("uniwind", () => ({
  useCSSVariable: (names: string[]) => names.map(() => "#336699"),
}));
vi.mock("react-native-reanimated", async () => {
  const { useEffect, useRef } = await import("react");
  return {
    useReducedMotion: () => state.reduced,
    useSharedValue: (value: unknown) => ({ value, set: () => undefined }),
    useDerivedValue: (compute: () => unknown) => ({ value: compute() }),
    useAnimatedReaction: (
      prepare: () => number,
      react: (value: number, previous: number | null) => void,
    ) => {
      // Runs the reaction after each render with the value it last saw, as the UI thread would.
      const previous = useRef<number | null>(null);
      useEffect(() => {
        const value = prepare();
        react(value, previous.current);
        previous.current = value;
      });
    },
    withTiming: (value: unknown) => value,
    runOnJS: (callback: unknown) => callback,
  };
});
vi.mock("@shopify/react-native-skia", async () => {
  const { createElement } = await import("react");
  const mark = (name: string) => (props: Record<string, unknown>) => {
    state.marks.push({ name, props });
    return createElement("i", null, props["children"] as ReactNode);
  };
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- vi.mock is hoisted above the module scope
  const path = () => ({
    moveTo: () => undefined,
    lineTo: () => undefined,
    close: () => undefined,
    addArc: () => undefined,
  });
  return {
    Skia: { Color: () => [0.2, 0.4, 0.6, 1], Path: { Make: path }, XYWHRect: () => ({}) },
    TextAlign: { Center: 2 },
    vec: (x: number, y: number) => ({ x, y }),
    Canvas: mark("Canvas"),
    Path: mark("Path"),
    Circle: mark("Circle"),
    Group: mark("Group"),
    Rect: mark("Rect"),
    RoundedRect: mark("RoundedRect"),
    Line: mark("SkiaLine"),
    LinearGradient: mark("LinearGradient"),
    DashPathEffect: mark("DashPathEffect"),
    Paint: mark("Paint"),
  };
});
vi.mock("victory-native", async () => {
  const { createElement } = await import("react");
  const mark = (name: string) => (props: Record<string, unknown>) => {
    state.marks.push({ name, props });
    if (typeof props["barOptions"] === "function") {
      const options = props["barOptions"] as (input: { isTop: boolean }) => unknown;
      state.marks.push({
        name: "barOptions",
        props: { top: options({ isTop: true }), base: options({ isTop: false }) },
      });
    }
    if (typeof props["areaOptions"] === "function") {
      const options = props["areaOptions"] as (input: Record<string, number>) => {
        children: ReactNode;
      };
      return createElement(
        "i",
        null,
        options({ rowIndex: 0, lowestY: 100, highestY: 10 }).children,
      );
    }
    if (typeof props["radius"] === "function") {
      const radius = props["radius"] as (point: Record<string, unknown>) => number;
      const points = props["points"] as Record<string, unknown>[];
      state.marks.push({
        name: "radii",
        props: { radii: [...points, { xValue: -1, yValue: -1 }].map(radius) },
      });
    }
    return createElement("i", null, props["children"] as ReactNode);
  };
  return {
    CartesianChart: (props: Record<string, unknown>) => {
      state.charts.push(props);
      // Marks the start of this draw, so a re-render's marks are read once.
      state.marks.push({ name: "@draw", props: {} });
      const data = props["data"] as Record<string, unknown>[];
      const keys = props["yKeys"] as string[];
      const xKey = props["xKey"] as string;
      const points = Object.fromEntries(
        keys.map((key) => [
          key,
          data.map((row, index) => ({
            x: index * 10,
            xValue: row[xKey],
            y: typeof row[key] === "number" ? 100 - (row[key] as number) : undefined,
            yValue: row[key],
          })),
        ]),
      );
      const draw = props["children"] as (args: unknown) => ReactNode;
      return createElement(
        "figure",
        null,
        draw({
          points,
          chartBounds: { left: 0, right: 200, top: 0, bottom: 100 },
          yScale: (value: number) => 100 - value,
        }),
      );
    },
    PolarChart: (props: Record<string, unknown>) => {
      state.charts.push(props);
      return createElement("figure", null, props["children"] as ReactNode);
    },
    Pie: {
      Chart: (props: { children: () => ReactNode }) => createElement("i", null, props.children()),
      Slice: mark("Slice"),
      SliceAngularInset: mark("SliceAngularInset"),
    },
    Area: mark("Area"),
    Bar: mark("Bar"),
    BarGroup: Object.assign(mark("BarGroup"), { Bar: mark("BarGroup.Bar") }),
    Line: mark("Line"),
    Scatter: mark("Scatter"),
    StackedArea: mark("StackedArea"),
    StackedBar: mark("StackedBar"),
    createParagraphLabelRenderer: (options: { maxWidth: (input: { text: string }) => number }) => ({
      width: options.maxWidth({ text: "abcd" }),
      render: (input: { text: string }) => createElement("label", null, input.text),
    }),
    useChartPressState: (initial: { y: Record<string, number> }) => ({
      state: {
        isActive: { value: state.active },
        matchedIndex: { value: state.index },
        x: { position: { value: 50 } },
        y: Object.fromEntries(
          Object.keys(initial.y).map((key) => [key, { position: { value: 20 } }]),
        ),
      },
      isActive: state.active,
    }),
  };
});

const DATA = [
  { month: "Jan", desktop: 60, mobile: 20, last: 50 },
  { month: "Feb", desktop: 30, mobile: null, last: 40 },
];
const DESKTOP = { key: "desktop", label: "Desktop", compareKey: "last" };
const MOBILE = { key: "mobile", label: "Mobile", color: "success" as const };
const SERIES = [DESKTOP, MOBILE];

const within = (direction: "ltr" | "rtl", node: ReactNode) =>
  render(
    <DesignSystemContext
      value={{ locale: direction === "rtl" ? "ar" : "en", direction } as DesignSystemState}
    >
      {node}
    </DesignSystemContext>,
  );
/** The marks of one name in the latest draw of the plot. */
const marks = (name: string) =>
  state.marks
    .slice(state.marks.map((item) => item.name).lastIndexOf("@draw") + 1)
    .filter((item) => item.name === name)
    .map((item) => item.props);
const chart = () => state.charts.at(-1) ?? {};
const layOut = (width: number) =>
  act(() => {
    for (const view of state.views.filter((item) => typeof item["onLayout"] === "function"))
      (view["onLayout"] as (event: unknown) => void)({ nativeEvent: { layout: { width } } });
  });

beforeEach(() => {
  state.reduced = false;
  state.active = false;
  state.index = 0;
  state.views.length = 0;
  state.charts.length = 0;
  state.marks.length = 0;
  state.played.length = 0;
});

describe("CartesianFigure", () => {
  it("draws a line per series with dots, the previous period dashed, and a readout of the pressed row", () => {
    state.active = true;
    within(
      "ltr",
      <LineChart
        data={DATA}
        series={SERIES}
        xKey="month"
        label="Visits"
        showDots
        showComparison
        curve="linear"
        showValueAxis
      />,
    );
    expect(marks("Line").map((props) => props["strokeWidth"])).toEqual([1.5, 2, 2]);
    expect(marks("Line")[0]?.["curveType"]).toBe("linear");
    expect(marks("Scatter")).toHaveLength(2);
    expect(marks("Circle")).toHaveLength(4);
    expect(marks("SkiaLine")).toHaveLength(1);
    expect(screen.getByText("Jan")).toBeTruthy();
    expect(screen.getByText("60")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
    expect(chart()).not.toHaveProperty("domain");
    const yAxis = (chart()["yAxis"] as { formatYLabel: (value: unknown) => string }[])[0];
    expect(yAxis?.formatYLabel(1500)).toBe("1.5K");
    expect(yAxis?.formatYLabel("x")).toBe("x");
  });

  it("draws soft-filled areas, references below the series and no readout when the tooltip is off", () => {
    state.active = true;
    within(
      "ltr",
      <AreaChart
        data={DATA}
        series={[{ key: "desktop", label: "Desktop" }]}
        xKey="month"
        label="Visits"
        showTooltip={false}
        showGrid={false}
        references={[
          { value: 90, label: "Target", color: "danger" },
          { from: 10, to: 20, label: "Band" },
          { value: 5 },
        ]}
      />,
    );
    expect(marks("Area")).toHaveLength(1);
    expect(marks("LinearGradient")).toHaveLength(1);
    expect(screen.getByText("Target")).toBeTruthy();
    expect(screen.getByText("Band")).toBeTruthy();
    expect(marks("Rect")[0]).toMatchObject({ y: 80, height: 10 });
    expect(chart()).not.toHaveProperty("chartPressState");
    expect(chart()["domain"]).toEqual({ y: [0, 90] });
    expect((chart()["yAxis"] as { lineWidth: number }[])[0]?.lineWidth).toBe(0);
    expect(screen.queryByText("60")).toBeNull();
  });

  it("stacks areas with a gradient per layer, as shares when normalised, on the right in Arabic", () => {
    state.reduced = true;
    within(
      "rtl",
      <AreaChart
        data={DATA}
        series={SERIES}
        xKey="month"
        label="Visits"
        stacked
        isNormalized
        showValueAxis
        references={[{ value: 1, label: "All" }]}
      />,
    );
    expect(marks("StackedArea")[0]).not.toHaveProperty("animate");
    expect(marks("LinearGradient")).toHaveLength(1);
    expect((chart()["data"] as Record<string, unknown>[]).map((row) => row["month"])).toEqual([
      "Feb",
      "Jan",
    ]);
    expect((chart()["data"] as Record<string, unknown>[])[1]).toMatchObject({
      desktop: 0.75,
      mobile: 0.25,
    });
    const yAxis = (
      chart()["yAxis"] as { axisSide: string; formatYLabel: (value: unknown) => string }[]
    )[0];
    expect(yAxis?.axisSide).toBe("right");
    expect(yAxis?.formatYLabel(0.5)).toContain("%");
  });

  it("stacks columns rounded only at the top and shades the pressed column", () => {
    state.active = true;
    within("ltr", <BarChart data={DATA} series={SERIES} xKey="month" label="Visits" stacked />);
    expect(marks("StackedBar")[0]?.["animate"]).toEqual({ type: "timing", duration: 300 });
    expect(marks("barOptions")[0]).toEqual({
      top: { roundedCorners: { topLeft: 4, topRight: 4 } },
      base: { roundedCorners: { topLeft: 0, topRight: 0 } },
    });
    expect(marks("Rect")[0]).toMatchObject({ width: 100, y: 0, height: 100 });
    expect(chart()["domain"]).toEqual({ y: [0, 80] });
  });

  it("draws one series as context columns and its latest in full, plain without emphasis, and groups several", () => {
    within(
      "ltr",
      <BarChart data={DATA} series={[MOBILE]} xKey="month" label="Visits" sort="value-desc" />,
    );
    // The context columns, edged in the field border, then the emphasised latest one.
    expect(marks("Bar")).toHaveLength(2);
    expect(marks("Paint")).toHaveLength(1);
    state.marks.length = 0;
    within(
      "ltr",
      <BarChart data={DATA} series={[MOBILE]} xKey="month" label="Visits" emphasis="none" />,
    );
    expect(marks("Bar")).toHaveLength(1);
    expect(marks("Paint")).toHaveLength(0);
    state.marks.length = 0;
    within(
      "ltr",
      <BarChart data={DATA} series={SERIES} xKey="month" label="Visits" showComparison />,
    );
    expect(marks("BarGroup.Bar").map((props) => props["points"] !== undefined)).toEqual([
      true,
      true,
      true,
    ]);
    expect(marks("BarGroup.Bar")).toHaveLength(3);
  });

  it("thins the category labels past six rows", () => {
    const many = Array.from({ length: 12 }, (_, index) => ({ month: `M${index}`, desktop: index }));
    within("ltr", <LineChart data={many} series={[DESKTOP]} xKey="month" label="Visits" />);
    expect((chart()["xAxis"] as { tickValues: number[] }).tickValues).toEqual([1, 4, 7, 10]);
  });
});

describe("ComposedChart", () => {
  it("draws one column and a line, with a crosshair, a selection tick and a readout on press", () => {
    state.active = true;
    within(
      "ltr",
      <ComposedChart
        data={DATA}
        series={[
          { key: "desktop", label: "Desktop" },
          { key: "mobile", label: "Mobile" },
        ]}
        xKey="month"
        label="Mix"
      />,
    );
    expect(marks("Bar")).toHaveLength(1);
    expect(marks("Line")).toHaveLength(1);
    expect(marks("Rect")[0]).toMatchObject({ width: 80 });
    expect(state.played).toEqual(["selection"]);
    expect(screen.getByText("Jan")).toBeTruthy();
    expect(screen.getAllByText("Mobile")).toHaveLength(2);
    expect(screen.getByText("20")).toBeTruthy();
  });

  it("groups several columns, runs right to left and hides the crosshair without a tooltip", () => {
    state.reduced = true;
    within(
      "rtl",
      <ComposedChart
        data={DATA}
        series={[
          { key: "desktop", label: "Desktop" },
          { key: "mobile", label: "Mobile" },
          { key: "last", label: "Last" },
        ]}
        lineKeys={["last"]}
        xKey="month"
        label="Mix"
        showTooltip={false}
        showGrid={false}
      />,
    );
    expect(marks("BarGroup.Bar")).toHaveLength(2);
    expect(marks("BarGroup.Bar")[0]).not.toHaveProperty("animate");
    expect(marks("Rect")).toHaveLength(0);
    expect((chart()["data"] as Record<string, unknown>[])[0]?.["month"]).toBe("Feb");
  });

  it("draws lines only when every series is a line", () => {
    within(
      "ltr",
      <ComposedChart
        data={DATA}
        series={[{ key: "desktop", label: "Desktop" }]}
        lineKeys={["desktop"]}
        xKey="month"
        label="Mix"
      />,
    );
    expect(marks("Bar")).toHaveLength(0);
    expect(marks("Rect")).toHaveLength(0);
  });
});

describe("CandlestickChart", () => {
  const candles = [
    { date: "D1", open: 10, high: 14, low: 9, close: 12, volume: 50 },
    { date: "D2", open: 12, high: 13, low: 8, close: 9 },
  ];

  it("draws each candle as a tinted body with an outline, and volume bars, with the pressed prices", () => {
    state.active = true;
    within("ltr", <CandlestickChart data={candles} label="Price" />);
    expect(marks("SkiaLine")).toHaveLength(2);
    // A body and its outline per candle, and one volume bar (D2 has no volume).
    expect(marks("Rect").filter((props) => props["style"] === "stroke")).toHaveLength(2);
    expect(marks("Rect")).toHaveLength(5);
    expect(screen.getByText("ui::chart.volume")).toBeTruthy();
    const yAxis = (chart()["yAxis"] as { formatYLabel: (value: unknown) => string }[])[0];
    expect(yAxis?.formatYLabel(12)).toBe("12");
    expect(yAxis?.formatYLabel(null)).toBe("");
  });

  it("drops the volume, runs right to left and has no readout when the tooltip is off", () => {
    state.active = true;
    within(
      "rtl",
      <CandlestickChart data={candles} showVolume={false} showTooltip={false} label="Price" />,
    );
    expect(marks("Rect")).toHaveLength(4);
    expect(chart()["domain"]).toEqual({ y: [8, 14] });
    expect(screen.queryByText("ui::chart.open")).toBeNull();
  });
});

describe("WaterfallChart", () => {
  it("draws a rounded block per step and reads the pressed change and total", () => {
    state.active = true;
    state.index = 1;
    within(
      "ltr",
      <WaterfallChart
        start={{ label: "Q3", value: 100 }}
        steps={[
          { key: "a", label: "New", value: 30 },
          { key: "b", label: "Lost", value: -50 },
        ]}
        endLabel="Q4"
        label="Profit"
      />,
    );
    // The two totals are one block each; a step is a tinted block with an outline.
    expect(marks("RoundedRect")).toHaveLength(6);
    expect(screen.getByText("ui::chart.change")).toBeTruthy();
    expect(screen.getByText("+30")).toBeTruthy();
    const yAxis = (chart()["yAxis"] as { formatYLabel: (value: unknown) => string }[])[0];
    expect(yAxis?.formatYLabel("x")).toBe("");
  });

  it("reads only the total for a total bar", () => {
    state.active = true;
    within(
      "ltr",
      <WaterfallChart
        start={{ label: "Q3", value: 100 }}
        steps={[]}
        endLabel="Q4"
        label="Profit"
      />,
    );
    expect(screen.queryByText("ui::chart.change")).toBeNull();
    expect(screen.getByText("ui::chart.total")).toBeTruthy();
  });
});

describe("ScatterChart", () => {
  const data = [
    { g: "a", x: 10, y: 3, s: 1 },
    { g: "b", x: 20, y: 4, s: 9 },
    { g: "a", x: "bad", y: 4, s: 2 },
  ];
  const series = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
  ];

  it("sizes each bubble by its value, speaks the size and draws reference lines and bands", () => {
    within(
      "ltr",
      <ScatterChart
        data={data}
        series={series}
        groupKey="g"
        xKey="x"
        yKey="y"
        sizeKey="s"
        sizeLabel="Size"
        xLabel="Price"
        yLabel="Units"
        label="Products"
        references={[{ value: 3, label: "Goal" }, { value: 2 }, { from: 1, to: 2 }]}
      />,
    );
    expect(marks("radii").map((props) => props["radii"])).toEqual([
      [3, 5, 5],
      [5, 14, 5],
    ]);
    expect(screen.getByText("Goal")).toBeTruthy();
    expect(marks("Rect")).toHaveLength(1);
    expect(
      state.views.find((view) => view["accessibilityRole"] === "image")?.["accessibilityValue"],
    ).toEqual({
      text: "A: Price 10, Units 3, Size 1; B: Price 20, Units 4, Size 9; Goal: 3; 2; 1–2",
    });
    const axis = chart()["xAxis"] as { formatXLabel: (value: unknown) => string };
    expect(axis.formatXLabel(2000)).toBe("2K");
    expect(axis.formatXLabel("x")).toBe("");
    const yAxis = (chart()["yAxis"] as { formatYLabel: (value: unknown) => string }[])[0];
    expect(yAxis?.formatYLabel(5)).toBe("5");
    expect(yAxis?.formatYLabel("x")).toBe("");
  });

  it("draws one series of even dots without groups, and writes the reference at the left in Arabic", () => {
    within(
      "rtl",
      <ScatterChart
        data={data}
        series={series.slice(0, 1)}
        xKey="x"
        yKey="y"
        xLabel="Price"
        yLabel="Units"
        label="Products"
        references={[{ value: 3, label: "Goal" }]}
      />,
    );
    expect(marks("radii")[0]?.["radii"]).toEqual([5, 5, 5]);
    expect(marks("Scatter")[0]?.["color"]).toBeDefined();
  });
});

describe("Polar and canvas charts", () => {
  it("RadarChart draws its rings, spokes and each series once laid out", () => {
    within(
      "ltr",
      <RadarChart
        data={[
          { skill: "A", me: 3, you: 1 },
          { skill: "B", me: 5, you: null },
        ]}
        series={[
          { key: "me", label: "Me" },
          { key: "you", label: "You" },
        ]}
        xKey="skill"
        label="Skills"
      />,
    );
    expect(marks("Canvas")).toHaveLength(0);
    layOut(300);
    expect(marks("Path").length).toBeGreaterThanOrEqual(9);
    expect(marks("Circle").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("A")).toBeTruthy();
  });

  it("RadialBarChart draws a track and a bar per row and its total in the middle", () => {
    within(
      "ltr",
      <RadialBarChart
        data={[
          { name: "a", value: 3 },
          { name: "b", value: "x" as unknown as number },
        ]}
        series={[{ key: "a", label: "A" }]}
        nameKey="name"
        valueKey="value"
        label="Goals"
        centerLabel="Total"
        maxValue={10}
        showLegend
      />,
    );
    layOut(240);
    expect(marks("Path").filter((props) => props["strokeCap"] === "round")).toHaveLength(2);
    expect(screen.getByText("Total")).toBeTruthy();
  });

  it("RadialBarChart sits still under Reduce Motion with no centre", () => {
    state.reduced = true;
    within(
      "ltr",
      <RadialBarChart
        data={[{ name: "a", value: 3 }]}
        series={[]}
        nameKey="name"
        valueKey="value"
        label="Goals"
      />,
    );
    layOut(240);
    expect(marks("Path")).toHaveLength(2);
  });

  it("PieChart and DonutChart hand Victory their slices, the donut with its total", () => {
    const data = [
      { name: "a", value: 3 },
      { name: "b", value: "x" as unknown as number },
    ];
    within(
      "ltr",
      <PieChart data={data} series={[]} nameKey="name" valueKey="value" label="Share" />,
    );
    expect((chart()["data"] as { value: number }[]).map((row) => row.value)).toEqual([3, 0]);
    expect(marks("Slice")).toHaveLength(1);
    expect(marks("SliceAngularInset")).toHaveLength(1);
    within(
      "ltr",
      <DonutChart
        data={data}
        series={[]}
        nameKey="name"
        valueKey="value"
        label="Share"
        centerLabel="All"
      />,
    );
    expect(screen.getByText("All")).toBeTruthy();
  });
});

describe("Sparkline", () => {
  it("draws a line, an area with its gradient, or columns, still under Reduce Motion", () => {
    within("ltr", <Sparkline data={[1, 2]} label="Trend" />);
    expect(marks("Line")[0]?.["animate"]).toBeDefined();
    within("ltr", <Sparkline data={[1, 2]} kind="area" label="Trend" />);
    expect(marks("Area")).toHaveLength(1);
    expect(marks("LinearGradient")).toHaveLength(1);
    state.reduced = true;
    within("ltr", <Sparkline data={[1, 2]} kind="bar" label="Trend" />);
    expect(marks("Bar")[0]).not.toHaveProperty("animate");
    expect(chart()["domain"]).toEqual({ y: [0] });
  });
});
