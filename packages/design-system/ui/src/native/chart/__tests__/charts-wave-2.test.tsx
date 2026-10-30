/**
 * Stackra file contract:
 * Purpose: proves the second wave of native charts: each is one image (a progressbar for the gauge) whose value reads
 *          its numbers in the locale; the waterfall, candlestick and scatter charts hand Victory their rows in reading
 *          order (reversed right to left, the scatter's numbers negated), and the heatmap and calendar shade cells.
 * Boundary: React Native, Victory Native, Skia, react-native-svg, Reanimated and Uniwind do not run in vitest, so they
 *           are recording stand-ins that render plain DOM; what the charts hand them is checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060; WCAG 2.2 SC 1.1.1 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { CalendarHeatmap } from "#native/calendar-heatmap/calendar-heatmap";
import { CandlestickChart } from "#native/candlestick-chart/candlestick-chart";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { GaugeChart } from "#native/gauge-chart/gauge-chart";
import { HeatmapChart } from "#native/heatmap-chart/heatmap-chart";
import { ScatterChart } from "#native/scatter-chart/scatter-chart";
import { WaterfallChart } from "#native/waterfall-chart/waterfall-chart";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  cells: [] as Record<string, unknown>[],
  charts: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, unknown>) => {
    state.views.push(props);
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    I18nManager: { isRTL: false },
    View: box,
    ScrollView: box,
    Pressable: (props: Record<string, unknown>) => {
      state.cells.push(props);
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
  useCSSVariable: (names: string[]) => names.map(() => "#336699"),
}));
vi.mock("react-native-reanimated", () => ({
  useReducedMotion: () => false,
  useAnimatedReaction: () => undefined,
  runOnJS: (callback: unknown) => callback,
}));
vi.mock("@shopify/react-native-skia", () => ({
  Skia: { Color: () => [0.2, 0.4, 0.6, 1] },
  TextAlign: { Center: 2 },
  vec: (x: number, y: number) => ({ x, y }),
  Group: () => null,
  Line: () => null,
  Rect: () => null,
  RoundedRect: () => null,
  DashPathEffect: () => null,
}));
vi.mock("react-native-svg", () => ({ default: () => null, Path: () => null, Line: () => null }));
vi.mock("victory-native", () => ({
  CartesianChart: (props: Record<string, unknown>) => {
    state.charts.push(props);
    return null;
  },
  Scatter: () => null,
  createParagraphLabelRenderer: () => ({ render: () => null }),
  useChartPressState: () => ({ state: {}, isActive: false }),
}));

/** Renders in a provider of the given locale and direction. */
const within = (locale: string, direction: "ltr" | "rtl", node: ReactNode) =>
  render(
    <DesignSystemContext value={{ locale, direction } as DesignSystemState}>
      {node}
    </DesignSystemContext>,
  );
const image = () => state.views.find((view) => view["accessibilityRole"] === "image") ?? {};

beforeEach(() => {
  state.views.length = 0;
  state.cells.length = 0;
  state.charts.length = 0;
});

describe("native second chart wave", () => {
  it("WaterfallChart speaks each change and total, and runs right to left in Arabic", () => {
    const props = {
      start: { label: "Q3", value: 100 },
      steps: [{ key: "a", label: "New", value: 30 }],
      endLabel: "Q4",
      label: "Profit",
    };
    within("en", "ltr", <WaterfallChart {...props} />);
    expect(image()["accessibilityValue"]).toEqual({ text: "Q3: 100; New: +30, 130; Q4: 130" });
    expect(
      ((state.charts[0]?.["data"] ?? []) as { label: string }[]).map((row) => row.label),
    ).toEqual(["Q3", "New", "Q4"]);
    state.charts.length = 0;
    within("ar", "rtl", <WaterfallChart {...props} />);
    expect(
      ((state.charts[0]?.["data"] ?? []) as { label: string }[]).map((row) => row.label),
    ).toEqual(["Q4", "New", "Q3"]);
    expect(((state.charts[0]?.["yAxis"] ?? []) as { axisSide: string }[])[0]?.axisSide).toBe(
      "right",
    );
  });

  it("CandlestickChart speaks each period's prices", () => {
    within(
      "en",
      "ltr",
      <CandlestickChart
        data={[{ date: "D1", open: 10, high: 12, low: 9, close: 11, volume: 5 }]}
        label="Price"
      />,
    );
    expect(image()["accessibilityValue"]).toEqual({
      text: "D1: Open 10, High 12, Low 9, Close 11",
    });
    expect(state.charts[0]?.["yKeys"]).toEqual(["low", "high", "open", "close"]);
  });

  it("ScatterChart splits groups into series and negates the numbers in Arabic", () => {
    const props = {
      data: [
        { g: "a", x: 10, y: 3 },
        { g: "b", x: 20, y: 4 },
      ],
      series: [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
      ],
      groupKey: "g",
      xKey: "x",
      yKey: "y",
      xLabel: "Price",
      yLabel: "Units",
      label: "Products",
    };
    within("en", "ltr", <ScatterChart {...props} />);
    expect(state.charts[0]?.["data"]).toEqual([
      { x: 10, a: 3, b: null },
      { x: 20, a: null, b: 4 },
    ]);
    expect(image()["accessibilityValue"]).toEqual({
      text: "A: Price 10, Units 3; B: Price 20, Units 4",
    });
    state.charts.length = 0;
    within("ar", "rtl", <ScatterChart {...props} />);
    expect(((state.charts[0]?.["data"] ?? []) as { x: number }[]).map((row) => row.x)).toEqual([
      -10, -20,
    ]);
  });

  it("GaugeChart is a progressbar that says its value against the target", () => {
    within("en", "ltr", <GaugeChart value={72} target={80} label="Sales" />);
    const bar = state.views.find((view) => view["accessibilityRole"] === "progressbar") ?? {};
    expect(bar["accessibilityLabel"]).toBe("Sales");
    expect(bar["accessibilityValue"]).toEqual({ min: 0, max: 100, now: 72, text: "72 of 80" });
  });

  it("HeatmapChart and CalendarHeatmap shade one pressable cell each and speak their values", () => {
    within(
      "en",
      "ltr",
      <HeatmapChart
        data={[
          { d: "Mon", h: "9", n: 1 },
          { d: "Mon", h: "10", n: 4 },
        ]}
        xKey="h"
        yKey="d"
        valueKey="n"
        label="Orders"
      />,
    );
    expect(state.cells).toHaveLength(2);
    expect(image()["accessibilityValue"]).toEqual({ text: "Mon, 9: 1; Mon, 10: 4" });
    state.cells.length = 0;
    state.views.length = 0;
    within(
      "en",
      "ltr",
      <CalendarHeatmap
        values={[{ date: "2026-10-01", value: 2 }]}
        start="2026-10-01"
        end="2026-10-01"
        weekStart={0}
        label="Days"
      />,
    );
    expect(state.cells).toHaveLength(7);
    expect(image()["accessibilityValue"]).toEqual({ text: "Thu, Oct 1: 2" });
  });
});
