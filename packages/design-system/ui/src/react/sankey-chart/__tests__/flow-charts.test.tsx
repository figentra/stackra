/**
 * Stackra file contract:
 * Purpose: proves the web sankey, sunburst, timeline and choropleth charts: each is an image named by its label with
 *          its numbers in a captioned data table (flows, nested slices with their path, tasks with their dates,
 *          regions with "No data" for a gap); the sunburst writes its total, the timeline its lanes and today, and the
 *          map its Less–More scale.
 * Boundary: jsdom; the drawn geometry is proven by the core layout tests and the playground screenshots.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1; STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";

import { ChoroplethMap } from "#react/choropleth-map/choropleth-map";
import { SankeyChart } from "#react/sankey-chart/sankey-chart";
import { SunburstChart } from "#react/sunburst-chart/sunburst-chart";
import { TimelineChart } from "#react/timeline-chart/timeline-chart";

/** The data table's rows as text. */
const rows = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .map((row) => row.textContent);

/** A one-degree square ring starting at `lon`. */
const square = (lon: number) => [
  [
    [lon, 0],
    [lon + 1, 0],
    [lon + 1, 1],
    [lon, 0],
  ],
];

describe("SankeyChart (web)", () => {
  it("is a named image with its flows in the table and each node's total", () => {
    render(
      <SankeyChart
        label="Traffic"
        nodes={[
          { key: "a", label: "Search" },
          { key: "b", label: "Cart" },
        ]}
        links={[{ source: "a", target: "b", value: 1200 }]}
      />,
    );
    expect(screen.getByRole("img", { name: "Traffic" })).toBeTruthy();
    expect(rows()).toEqual(["FromToValue", "SearchCart1,200"]);
    expect(screen.getAllByText("1,200")).toHaveLength(3);
  });
});

describe("SunburstChart (web)", () => {
  it("reads each slice with its path and writes the total in the middle", () => {
    render(
      <SunburstChart
        label="Revenue"
        centerLabel="Total"
        items={[
          { key: "d", label: "Drinks", children: [{ key: "c", label: "Coffee", value: 30 }] },
          { key: "f", label: "Food", value: 20 },
        ]}
      />,
    );
    expect(rows()).toEqual(["CategoryValue", "Drinks30", "Drinks › Coffee30", "Food20"]);
    expect(screen.getByText("50")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Revenue" }).querySelectorAll("path")).toHaveLength(3);
  });
});

describe("TimelineChart (web)", () => {
  it("names its lanes, marks today and lists each task with its dates", () => {
    render(
      <TimelineChart
        label="Plan"
        today="2026-11-10"
        rows={[
          { key: "design", label: "Design" },
          { key: "build", label: "Build" },
        ]}
        tasks={[
          { key: "a", rowKey: "design", label: "Screens", start: "2026-11-02", end: "2026-11-13" },
          { key: "b", rowKey: "build", label: "API", start: "2026-11-09", end: "2026-11-27" },
        ]}
      />,
    );
    expect(rows()).toEqual(["TaskLaneStartEnd", "ScreensDesignNov 2Nov 13", "APIBuildNov 9Nov 27"]);
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getAllByText("Design")).toHaveLength(2);
  });
});

describe("ChoroplethMap (web)", () => {
  it("lists every region with its value or No data, and draws the scale", () => {
    render(
      <ChoroplethMap
        label="Orders"
        values={{ a: 1500 }}
        features={{
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { id: "a", name: "North" },
              geometry: { type: "Polygon", coordinates: square(0) },
            },
            {
              type: "Feature",
              properties: { id: "b", name: "South" },
              geometry: { type: "Polygon", coordinates: square(1) },
            },
          ],
        }}
      />,
    );
    expect(rows()).toEqual(["RegionValue", "North1,500", "SouthNo data"]);
    expect(screen.getByRole("img", { name: "Orders" }).querySelectorAll("path")).toHaveLength(2);
    expect(screen.getByText("Less")).toBeTruthy();
    expect(screen.getByText("More")).toBeTruthy();
  });
});
