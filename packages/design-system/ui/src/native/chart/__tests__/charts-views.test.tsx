/**
 * Stackra file contract:
 * Purpose: proves the native charts drawn with Views: the funnel speaks each stage with its conversion; the range bar,
 *          box plot and histogram show the pressed item's readout and clear it on release, in both orientations; the
 *          treemap lays out its tiles once measured; horizontal bars stack or group; the stacked meter writes its
 *          total and legend; the calendar heatmap shows the pressed day; the gauge, sankey and choropleth handle their
 *          optional parts; the Kpi and TrendChip read the trend in words.
 * Boundary: React Native, Skia, react-native-svg and Uniwind do not run in vitest, so they and the house Text, Card,
 *           Icon, Stat and Chip are recording stand-ins that render plain DOM; what they are handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303; ADR 0060; WCAG 2.2 SC 1.1.1 and 1.4.1; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { BarChart } from "#native/bar-chart/bar-chart";
import { BoxPlotChart } from "#native/box-plot-chart/box-plot-chart";
import { CalendarHeatmap } from "#native/calendar-heatmap/calendar-heatmap";
import { ChoroplethMap } from "#native/choropleth-map/choropleth-map";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { FunnelChart } from "#native/funnel-chart/funnel-chart";
import { GaugeChart } from "#native/gauge-chart/gauge-chart";
import { HistogramChart } from "#native/histogram-chart/histogram-chart";
import { Kpi } from "#native/kpi/kpi";
import { TrendChip } from "#native/kpi/trend-chip";
import { RangeBarChart } from "#native/range-bar-chart/range-bar-chart";
import { SankeyChart } from "#native/sankey-chart/sankey-chart";
import { StackedMeter } from "#native/stacked-meter/stacked-meter";
import { TreemapChart } from "#native/treemap-chart/treemap-chart";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  marks: [] as { name: string; props: Record<string, unknown> }[],
  props: {} as Record<string, Record<string, unknown>>,
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
    ScrollView: (props: Record<string, unknown> & { ref?: (view: unknown) => void }) => {
      props.ref?.({ scrollToEnd: () => undefined });
      return box(props);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement(
        "button",
        {
          type: "button",
          disabled: props["disabled"] as boolean,
          onClick: props["onPress"] as () => void,
          onPointerDown: props["onPressIn"] as () => void,
          onPointerUp: props["onPressOut"] as () => void,
        },
        props["children"] as ReactNode,
      );
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
vi.mock("#native/card/card", async () => {
  const { createElement } = await import("react");
  return {
    Card: (props: Record<string, unknown>) =>
      createElement("section", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) =>
      createElement("i", { "data-testid": `icon:${String(props["name"])}` }),
  };
});
vi.mock("#native/stat/stat", () => ({
  Stat: (props: Record<string, unknown>) => {
    state.props["stat"] = props;
    return null;
  },
}));
vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return {
    Chip: (props: Record<string, unknown>) => {
      state.props["chip"] = props;
      return createElement("b", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));
vi.mock("uniwind", () => ({ useCSSVariable: (names: string[]) => names.map(() => "#336699") }));
vi.mock("@shopify/react-native-skia", async () => {
  const { createElement } = await import("react");
  const mark = (name: string) => (props: Record<string, unknown>) => {
    state.marks.push({ name, props });
    return createElement("i", null, props["children"] as ReactNode);
  };
  return {
    Skia: { Color: () => [0.2, 0.4, 0.6, 1], Path: { MakeFromSVGString: () => ({}) } },
    Canvas: mark("Canvas"),
    Path: mark("Path"),
    RoundedRect: mark("RoundedRect"),
  };
});
// The column path of BarChart is not drawn here; its imports only need to load.
vi.mock("react-native-reanimated", () => ({}));
vi.mock("victory-native", () => ({ CartesianChart: () => null }));
vi.mock("react-native-svg", async () => {
  const { createElement } = await import("react");
  const mark = (name: string) => (props: Record<string, unknown>) => {
    state.marks.push({ name, props });
    return createElement("i", null, props["children"] as ReactNode);
  };
  return { default: mark("Svg"), Path: mark("SvgPath"), Line: mark("SvgLine") };
});

const within = (direction: "ltr" | "rtl", node: ReactNode) =>
  render(
    <DesignSystemContext
      value={{ locale: direction === "rtl" ? "ar" : "en", direction } as DesignSystemState}
    >
      {node}
    </DesignSystemContext>,
  );
const marks = (name: string) =>
  state.marks.filter((item) => item.name === name).map((item) => item.props);
const spoken = () =>
  (
    state.views.find((view) => view["accessibilityRole"] === "image")?.["accessibilityValue"] as {
      text: string;
    }
  )?.text;
const layOut = (width: number) =>
  act(() => {
    for (const view of state.views.filter((item) => typeof item["onLayout"] === "function"))
      (view["onLayout"] as (event: unknown) => void)({ nativeEvent: { layout: { width } } });
  });
const pressIn = (button: HTMLElement | undefined) => fireEvent.pointerDown(button as HTMLElement);
const pressOut = (button: HTMLElement | undefined) => fireEvent.pointerUp(button as HTMLElement);

beforeEach(() => {
  state.views.length = 0;
  state.marks.length = 0;
  state.props = {};
});

describe("FunnelChart", () => {
  const stages = [
    { key: "a", label: "Visits", value: 1000 },
    { key: "b", label: "Carts", value: 250 },
  ];

  it("speaks each stage with its conversion from the one before", () => {
    within("ltr", <FunnelChart stages={stages} label="Funnel" />);
    expect(spoken()).toBe('Visits 1,000، Carts 250 ui::funnel_chart.conversion {"value":"25%"}');
    expect(
      state.views.find((view) => (view["style"] as { width?: string })?.width === "100%"),
    ).toBeTruthy();
  });

  it("drops the conversion when asked and sorts the stages", () => {
    within(
      "ltr",
      <FunnelChart stages={stages} label="Funnel" showConversion={false} sort="value-asc" />,
    );
    expect(spoken()).toBe("Carts 250، Visits 1,000");
  });
});

describe("RangeBarChart", () => {
  const data = [
    { day: "Mon", low: 5, high: 9 },
    { day: "Tue", low: 12, high: 7 },
    { day: "Wed", low: null, high: 4 },
  ];

  it("shows the pressed column's high and low and clears it on release", () => {
    within("ltr", <RangeBarChart data={data} xKey="day" fromKey="low" toKey="high" label="Temp" />);
    const [mon] = screen.getAllByRole("button");
    pressIn(mon);
    expect(screen.getByText("ui::chart.high")).toBeTruthy();
    expect(screen.getByText("9")).toBeTruthy();
    pressOut(mon);
    expect(screen.queryByText("ui::chart.high")).toBeNull();
  });

  it("draws rows from the start when horizontal, and no readout without the tooltip", () => {
    within(
      "ltr",
      <RangeBarChart
        data={data}
        xKey="day"
        fromKey="low"
        toKey="high"
        label="Temp"
        orientation="horizontal"
        showTooltip={false}
      />,
    );
    const bars = state.views.filter((view) => (view["style"] as { start?: string })?.start);
    expect(bars).toHaveLength(2);
    const [mon] = screen.getAllByRole("button");
    pressIn(mon);
    expect(screen.queryByText("ui::chart.high")).toBeNull();
    pressOut(mon);
  });
});

describe("BoxPlotChart", () => {
  it("reads the pressed group's five numbers and clears them on release", () => {
    within(
      "ltr",
      <BoxPlotChart
        groups={[
          { key: "a", label: "A", values: [1, 2, 3, 4, 5, 40] },
          { key: "b", label: "B", values: [] },
        ]}
        label="Spread"
      />,
    );
    const [a] = screen.getAllByRole("button");
    pressIn(a);
    expect(screen.getByText("ui::chart.median")).toBeTruthy();
    pressOut(a);
    expect(screen.queryByText("ui::chart.median")).toBeNull();
  });

  it("shows no readout without the tooltip", () => {
    within(
      "ltr",
      <BoxPlotChart
        groups={[{ key: "a", label: "A", values: [2, 2] }]}
        label="Spread"
        showTooltip={false}
      />,
    );
    pressIn(screen.getAllByRole("button")[0]);
    expect(screen.queryByText("ui::chart.median")).toBeNull();
  });
});

describe("HistogramChart", () => {
  it("dims the other bins while one is pressed, and labels only the ends past six bins", () => {
    within(
      "ltr",
      <HistogramChart
        values={[1, 2, 3, 4, 5, 6, 7, 8]}
        binCount={8}
        label="Sizes"
        showTooltip={false}
      />,
    );
    const [first] = screen.getAllByRole("button");
    pressIn(first);
    const dims = state.views.filter(
      (view) => (view["style"] as { opacity?: number })?.opacity === 0.6,
    );
    expect(dims.length).toBeGreaterThan(0);
    expect(screen.queryByText("ui::chart.count")).toBeNull();
    pressOut(first);
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
  });
});

describe("TreemapChart", () => {
  it("speaks every item and lays its tiles out once measured", () => {
    within(
      "ltr",
      <TreemapChart
        items={[
          { key: "a", label: "A", value: 60 },
          { key: "b", label: "B", value: 40 },
        ]}
        label="Share"
        sort="value-desc"
      />,
    );
    expect(spoken()).toBe("A 60، B 40");
    expect(screen.queryByText("A")).toBeNull();
    layOut(300);
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("40")).toBeTruthy();
  });
});

describe("HorizontalBars", () => {
  const data = [
    { team: "X", won: 3, lost: 1 },
    { team: "Y", won: 2, lost: "n/a" },
  ];
  const series = [
    { key: "won", label: "Won" },
    { key: "lost", label: "Lost" },
  ];

  it("stacks each row into one bar with its total after it", () => {
    within(
      "ltr",
      <BarChart
        orientation="horizontal"
        stacked
        data={data}
        series={series}
        xKey="team"
        label="Games"
      />,
    );
    expect(screen.getByText("4")).toBeTruthy();
    expect(
      state.views.filter((view) => (view["style"] as { flex?: number })?.flex !== undefined),
    ).toHaveLength(4);
  });

  it("draws thin grouped bars and leaves a missing value blank", () => {
    within(
      "ltr",
      <BarChart
        orientation="horizontal"
        data={data}
        series={series}
        xKey="team"
        label="Games"
        sort="value-asc"
      />,
    );
    expect(state.views.filter((view) => view["className"] === "h-3")).toHaveLength(4);
    expect(screen.getAllByText("3")).toHaveLength(1);
  });
});

describe("StackedMeter", () => {
  it("writes the total against the max, skips empty segments and shows its legend", () => {
    within(
      "ltr",
      <StackedMeter
        label="Storage"
        max={100}
        segments={[
          { key: "a", label: "Photos", value: 30 },
          { key: "b", label: "Mail", value: 0, color: "danger" },
        ]}
      />,
    );
    expect(screen.getByText('ui::stacked_meter.total {"used":"30","max":"100"}')).toBeTruthy();
    expect(
      state.views.filter((view) => (view["style"] as { width?: string })?.width === "30%"),
    ).toHaveLength(1);
    expect(screen.getByText("Mail")).toBeTruthy();
  });

  it("hides the legend when asked and grows the max to the total", () => {
    within(
      "ltr",
      <StackedMeter
        label="Storage"
        showLegend={false}
        segments={[{ key: "a", label: "Photos", value: 30 }]}
      />,
    );
    expect(screen.getByText('ui::stacked_meter.total {"used":"30","max":"30"}')).toBeTruthy();
    expect(screen.queryByText("Photos")).toBeNull();
  });
});

describe("CalendarHeatmap", () => {
  it("writes the pressed day, outlines it and hides the scale when asked", () => {
    within(
      "ltr",
      <CalendarHeatmap
        values={[{ date: "2026-10-01", value: 2 }]}
        end="2026-10-02"
        weekStart={0}
        showLegend={false}
        label="Activity"
      />,
    );
    const days = screen
      .getAllByRole("button")
      .filter((button) => !(button as HTMLButtonElement).disabled);
    act(() => days[0]?.click());
    expect(screen.getByText("Thu, Oct 1: 2")).toBeTruthy();
    expect(
      state.views.some((view) => (view["style"] as { borderWidth?: number })?.borderWidth === 2),
    ).toBe(true);
    act(() => days[1]?.click());
    expect(screen.getByText("Fri, Oct 2: –")).toBeTruthy();
  });

  it("draws an empty calendar with no days", () => {
    within("ltr", <CalendarHeatmap values={[]} label="Activity" />);
    expect(spoken()).toBe("");
  });
});

describe("GaugeChart", () => {
  it("says its value alone without a target and draws no fill at the minimum", () => {
    within("ltr", <GaugeChart value={0} label="Load" centerLabel="CPU" />);
    const bar = state.views.find((view) => view["accessibilityRole"] === "progressbar") ?? {};
    expect(bar["accessibilityValue"]).toEqual({ min: 0, max: 100, now: 0, text: "0" });
    expect(marks("SvgPath")).toHaveLength(1);
    expect(marks("SvgLine")).toHaveLength(0);
    expect(screen.getByText("CPU")).toBeTruthy();
  });

  it("draws the fill and a target mark with its caption", () => {
    within("ltr", <GaugeChart value={40} target={70} label="Load" />);
    expect(marks("SvgPath")).toHaveLength(2);
    expect(marks("SvgLine")).toHaveLength(1);
    expect(screen.getByText("ui::chart.target: 70")).toBeTruthy();
  });
});

describe("SankeyChart", () => {
  const nodes = [
    { key: "a", label: "Search" },
    { key: "b", label: "Cart" },
    { key: "c", label: "Lost" },
  ];

  it("labels each node toward the reading end once measured, the last column before it", () => {
    within(
      "ltr",
      <SankeyChart
        label="Traffic"
        nodes={nodes}
        links={[{ source: "a", target: "b", value: 10 }]}
      />,
    );
    expect(marks("Canvas")).toHaveLength(0);
    layOut(300);
    expect(marks("RoundedRect")).toHaveLength(2);
    expect(
      state.views.filter((view) => String(view["className"]).includes("items-start")),
    ).toHaveLength(1);
    expect(
      state.views.filter((view) => String(view["className"]).includes("items-end")),
    ).toHaveLength(1);
  });

  it("swaps the label sides right to left", () => {
    within(
      "rtl",
      <SankeyChart
        label="Traffic"
        nodes={nodes}
        links={[
          { source: "a", target: "b", value: 10 },
          { source: "a", target: "c", value: 5 },
        ]}
      />,
    );
    layOut(300);
    expect(spoken()).toContain("، ");
    expect(marks("RoundedRect")).toHaveLength(3);
  });
});

describe("ChoroplethMap", () => {
  it("shades known regions once measured and adds no gap key when every region has data", () => {
    within(
      "rtl",
      <ChoroplethMap
        label="Orders"
        values={{ a: 5 }}
        features={{
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { id: "a", name: "North" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 0],
                  ],
                ],
              },
            },
          ],
        }}
      />,
    );
    layOut(300);
    expect(marks("Path")).toHaveLength(2);
    expect(screen.queryByText("ui::chart.no_data")).toBeNull();
  });
});

describe("Kpi and TrendChip", () => {
  it("Kpi puts its icon in a hidden tile and hands the rest to Stat", () => {
    within("ltr", <Kpi icon="car" label="Orders" value="12" />);
    expect(screen.getByTestId("icon:car")).toBeTruthy();
    expect(state.props["stat"]).toMatchObject({ label: "Orders", value: "12" });
    state.views.length = 0;
    within("ltr", <Kpi label="Orders" value="12" />);
    expect(
      state.views.some((view) => view["importantForAccessibility"] === "no-hide-descendants"),
    ).toBe(false);
  });

  it("TrendChip says a rise in words with the comparison, and a fall as bad when up is better", () => {
    within("ltr", <TrendChip value={0.12} comparison="vs last week" />);
    expect(state.views.at(-1)?.["accessibilityLabel"]).toBe(
      'ui::trend_chip.up {"value":"12%"}, vs last week',
    );
    expect(state.props["chip"]).toMatchObject({ tone: "success" });
    expect(screen.getByText("vs last week")).toBeTruthy();
    within("ltr", <TrendChip value={-0.05} />);
    expect(state.props["chip"]).toMatchObject({ tone: "danger" });
    expect(state.views.at(-1)?.["accessibilityLabel"]).toBe('ui::trend_chip.down {"value":"5%"}');
  });

  it("TrendChip says a flat trend without a number, and a fall as good when down is better", () => {
    within("ltr", <TrendChip value={0} />);
    expect(state.views.at(-1)?.["accessibilityLabel"]).toBe("ui::trend_chip.flat");
    within("ltr", <TrendChip value={-3} better="down" format={{ style: "decimal" }} />);
    expect(state.props["chip"]).toMatchObject({ tone: "success", children: "-3" });
  });
});
