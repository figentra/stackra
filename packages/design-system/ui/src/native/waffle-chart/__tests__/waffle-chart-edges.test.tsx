/**
 * Stackra file contract:
 * Purpose: proves the native WaffleChart's edges: nothing is drawn before it is measured; a narrow chart shrinks its
 *          squares (never below 2 points) on a custom grid; a missing or negative value counts as nothing, so an
 *          all-empty whole draws every square in the grid colour and reads 0%; and the legend can be hidden.
 * Boundary: React Native, Skia and Uniwind do not run in vitest, so they are recording stand-ins that render plain
 *           DOM; what the chart hands them is checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { WaffleChart } from "#native/waffle-chart/waffle-chart";
import type { WaffleChartProps } from "#native/waffle-chart/waffle-chart.props";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  texts: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/text/text", () => ({
  Text: (props: Record<string, unknown>) => {
    state.texts.push(String(props["children"]));
    return null;
  },
}));
vi.mock("uniwind", () => ({
  useCSSVariable: (names: string[]) => names.map((name) => name),
}));
vi.mock("@shopify/react-native-skia", () => ({ Skia: { Color: () => [0.2, 0.4, 0.6, 1] } }));

const SERIES = [
  { key: "card", label: "Card" },
  { key: "cod", label: "Cash on delivery" },
];

type Square = { width: number; backgroundColor: string };

/** Draws the chart, measures it at `width` and returns its squares. */
const drawAt = (width: number, props: Partial<WaffleChartProps>): Square[] => {
  state.views = [];
  state.texts = [];
  render(
    <DesignSystemContext value={{ locale: "en", direction: "ltr" } as DesignSystemState}>
      <WaffleChart
        data={[]}
        series={SERIES}
        nameKey="method"
        valueKey="orders"
        label="Payments"
        {...props}
      />
    </DesignSystemContext>,
  );
  const measured = state.views.find((view) => typeof view["onLayout"] === "function") ?? {};
  state.views = [];
  state.texts = [];
  act(() =>
    (measured["onLayout"] as (event: unknown) => void)({ nativeEvent: { layout: { width } } }),
  );
  return state.views
    .map((view) => view["style"] as Square | undefined)
    .filter((style): style is Square => style?.backgroundColor !== undefined);
};

describe("WaffleChart edges (native)", () => {
  it("draws nothing until measured", () => {
    drawAt(0, { data: [{ method: "card", orders: 3 }] });
    expect(state.views.filter((view) => (view["style"] as Square | undefined)?.width)).toEqual([]);
  });

  it("shrinks the squares on a narrow custom grid", () => {
    const squares = drawAt(50, {
      data: [
        { method: "card", orders: 3 },
        { method: "cod", orders: 1 },
      ],
      columns: 4,
      rows: 2,
      showLegend: false,
    });
    const cells = squares.filter((style) => style.width < 18 && style.width > 2);
    expect(cells).toHaveLength(8);
    // (50 - 3 gaps of 3) / 4 columns.
    expect(cells[0]?.width).toBeCloseTo(10.25);
    expect(state.texts).toEqual([]);
    const tiny = drawAt(4, { data: [{ method: "card", orders: 1 }], columns: 4, rows: 1 });
    expect(tiny.filter((style) => style.width === 2)).toHaveLength(4);
  });

  it("counts a missing or negative value as nothing", () => {
    const squares = drawAt(300, {
      data: [
        { method: "card", orders: -5 },
        { method: "cod", orders: "n/a" as unknown as number },
      ],
    });
    const cells = squares.filter((style) => style.width === 18);
    expect(cells).toHaveLength(100);
    // Every square is the one grid colour, none a part's chart colour.
    const colors = new Set(cells.map((style) => style.backgroundColor));
    expect(colors.size).toBe(1);
    expect([...colors][0]).not.toMatch(/chart/u);
    expect(state.texts.filter((text) => text.endsWith("%"))).toEqual(["0%", "0%"]);
  });
});
