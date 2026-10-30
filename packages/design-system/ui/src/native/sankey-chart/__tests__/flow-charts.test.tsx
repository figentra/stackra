/**
 * Stackra file contract:
 * Purpose: proves the native sankey, sunburst, timeline and choropleth charts: each is one image named by its label
 *          whose value reads every flow, slice, task or region in the locale (Arabic-Indic digits when asked); the
 *          sankey mirrors in Arabic, the sunburst draws a filled slice and a surface gap per arc, the timeline places
 *          bars from the reading start, and the map fills holes even-odd.
 * Boundary: React Native, Skia and Uniwind do not run in vitest, so they are replaced by recording stand-ins that render
 *           plain DOM; what the charts hand them is checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060; WCAG 2.2 SC 1.1.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { ChoroplethMap } from "#native/choropleth-map/choropleth-map";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { SankeyChart } from "#native/sankey-chart/sankey-chart";
import { SunburstChart } from "#native/sunburst-chart/sunburst-chart";
import { TimelineChart } from "#native/timeline-chart/timeline-chart";

const state = vi.hoisted(() => ({
  images: [] as Record<string, unknown>[],
  views: [] as Record<string, unknown>[],
  paths: [] as Record<string, unknown>[],
  rects: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    View: (props: Record<string, unknown>) => {
      if (props["accessibilityRole"] === "image") state.images.push(props);
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
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

vi.mock("#native/chart/use-canvas-size", () => ({
  useCanvasSize: () => ({ width: 300, onLayout: () => undefined }),
}));

vi.mock("uniwind", () => ({ useCSSVariable: (names: string[]) => names.map(() => "#336699") }));

vi.mock("@shopify/react-native-skia", async () => {
  const { createElement } = await import("react");
  return {
    Skia: { Color: () => [0.2, 0.4, 0.6, 1] },
    Canvas: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Path: (props: Record<string, unknown>) => {
      state.paths.push(props);
      return null;
    },
    RoundedRect: (props: Record<string, unknown>) => {
      state.rects.push(props);
      return null;
    },
  };
});

/** Renders in a provider of the given locale and direction. */
const within = (locale: string, direction: "ltr" | "rtl", node: ReactNode) =>
  render(
    <DesignSystemContext value={{ locale, direction } as DesignSystemState}>
      {node}
    </DesignSystemContext>,
  );

beforeEach(() => {
  state.images.length = 0;
  state.views.length = 0;
  state.paths.length = 0;
  state.rects.length = 0;
});

const NODES = [
  { key: "a", label: "Search" },
  { key: "b", label: "Cart" },
];

describe("native SankeyChart", () => {
  it("speaks every flow and draws a band and a bar per node", () => {
    within(
      "en",
      "ltr",
      <SankeyChart
        label="Traffic"
        nodes={NODES}
        links={[{ source: "a", target: "b", value: 1200 }]}
      />,
    );
    expect(state.images[0]).toMatchObject({
      accessibilityLabel: "Traffic",
      accessibilityValue: { text: "Search → Cart 1,200" },
    });
    expect(state.paths).toHaveLength(1);
    expect(state.rects.map((rect) => rect["x"])).toEqual([0, 288]);
  });

  it("runs from the right in Arabic with Arabic-Indic digits", () => {
    within(
      "ar-u-nu-arab",
      "rtl",
      <SankeyChart
        label="الزوار"
        nodes={NODES}
        links={[{ source: "a", target: "b", value: 1200 }]}
      />,
    );
    expect(state.rects.map((rect) => rect["x"])).toEqual([288, 0]);
    const spoken = state.images[0]?.["accessibilityValue"] as { text: string } | undefined;
    expect(spoken?.text).toContain("١٬٢٠٠");
  });
});

describe("native SunburstChart", () => {
  it("speaks each slice with its path and draws a fill and a gap per arc", () => {
    within(
      "en",
      "ltr",
      <SunburstChart
        label="Revenue"
        items={[
          { key: "d", label: "Drinks", children: [{ key: "c", label: "Coffee", value: 30 }] },
          { key: "f", label: "Food", value: 20 },
        ]}
      />,
    );
    expect(state.images[0]?.["accessibilityValue"]).toEqual({
      text: "Drinks 30, Drinks › Coffee 30, Food 20",
    });
    expect(state.paths).toHaveLength(6);
    expect(state.paths[1]).toMatchObject({ style: "stroke", strokeWidth: 2 });
  });
});

describe("native TimelineChart", () => {
  it("speaks each task with its lane and dates and places bars from the reading start", () => {
    within(
      "en",
      "ltr",
      <TimelineChart
        label="Plan"
        rows={[{ key: "design", label: "Design" }]}
        tasks={[
          { key: "a", rowKey: "design", label: "Screens", start: "2026-11-02", end: "2026-11-15" },
        ]}
      />,
    );
    expect(state.images[0]?.["accessibilityValue"]).toEqual({
      text: "Design: Screens Nov 2 – Nov 15",
    });
    const bar = state.views.find((view) => String(view["className"]).includes("top-2"));
    expect(bar?.["style"]).toMatchObject({ start: "0%", width: "100%" });
  });
});

describe("native ChoroplethMap", () => {
  it("speaks every region, gaps as No data, and fills holes even-odd", () => {
    within(
      "en",
      "ltr",
      <ChoroplethMap
        label="Orders"
        values={{ a: 1500 }}
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
            {
              type: "Feature",
              properties: { id: "b", name: "South" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [1, 0],
                    [2, 0],
                    [2, 1],
                    [1, 0],
                  ],
                ],
              },
            },
          ],
        }}
      />,
    );
    expect(state.images[0]?.["accessibilityValue"]).toEqual({ text: "North 1,500, South No data" });
    expect(state.paths.filter((path) => path["fillType"] === "evenOdd")).toHaveLength(2);
  });
});
