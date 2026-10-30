/**
 * Stackra file contract:
 * Purpose: proves the chart layouts' edge cases: a sankey with no usable flows (one centred column, mirrored in RTL),
 *          a heatmap with missing keys and gaps, the raw table's formats, gaps and compare columns, reference line and
 *          band text, choropleth regions with no shape or no properties, an empty meter, an empty or reversed
 *          timeline, a treemap that keeps the caller's order, and a sunburst parent summed from its children.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import type { GeoFeatureCollection } from "#contracts/types/geo-feature-collection.type";
import { chartDataOf } from "#core/functions/chart-data-of.function";
import { chartReferenceTextOf } from "#core/functions/chart-reference-text-of.function";
import { choroplethShapesOf } from "#core/functions/choropleth-shapes-of.function";
import { heatmapGridOf } from "#core/functions/heatmap-grid-of.function";
import { meterSharesOf } from "#core/functions/meter-shares-of.function";
import { sankeyLayoutOf } from "#core/functions/sankey-layout-of.function";
import { sunburstValueOf } from "#core/functions/sunburst-value-of.function";
import { timelineLayoutOf } from "#core/functions/timeline-layout-of.function";
import { treemapLayoutOf } from "#core/functions/treemap-layout-of.function";

describe("sankeyLayoutOf", () => {
  const nodes = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
  ];

  it("drops zero, negative and unknown flows and centres one column", () => {
    const layout = sankeyLayoutOf(
      nodes,
      [
        { source: "a", target: "b", value: 0 },
        { source: "a", target: "b", value: -2 },
        { source: "a", target: "z", value: 3 },
      ],
      { width: 100, height: 50, nodeWidth: 10 },
    );
    expect(layout.columns).toBe(1);
    expect(layout.links).toEqual([]);
    expect(layout.nodes.map((node) => [node.x, node.height, node.value])).toEqual([
      [45, 0, 0],
      [45, 0, 0],
    ]);
  });

  it("mirrors the columns and the bands in RTL", () => {
    const links = [{ source: "a", target: "b", value: 4 }];
    const ltr = sankeyLayoutOf(nodes, links, { width: 100, height: 40 });
    const rtl = sankeyLayoutOf(nodes, links, { width: 100, height: 40, isRtl: true });
    expect(ltr.nodes.map((node) => node.x)).toEqual([0, 88]);
    expect(rtl.nodes.map((node) => node.x)).toEqual([88, 0]);
    expect(ltr.links[0]?.path.startsWith("M 12.00 ")).toBe(true);
    expect(rtl.links[0]?.path.startsWith("M 88.00 ")).toBe(true);
  });

  it("stops relaxing a cycle after one round per node", () => {
    const layout = sankeyLayoutOf(
      nodes,
      [
        { source: "a", target: "b", value: 1 },
        { source: "b", target: "a", value: 1 },
      ],
      { width: 100, height: 40 },
    );
    expect(layout.nodes.every((node) => Number.isFinite(node.y))).toBe(true);
  });
});

describe("heatmapGridOf", () => {
  it("reads a missing key as an empty label and skips values that are not finite numbers", () => {
    const grid = heatmapGridOf(
      [
        { d: "Mon", n: 3 },
        { h: "9", d: "Mon", n: "x" },
        { h: "9", n: Number.NaN },
      ],
      "h",
      "d",
      "n",
    );
    expect(grid.columns).toEqual(["", "9"]);
    expect(grid.rows).toEqual(["Mon", ""]);
    expect(grid.cells).toEqual([
      [3, null],
      [null, null],
    ]);
    expect([grid.min, grid.max]).toEqual([3, 3]);
  });

  it("gives a zero range with no values", () => {
    expect(heatmapGridOf([], "h", "d", "n")).toEqual({
      columns: [],
      rows: [],
      cells: [],
      min: 0,
      max: 0,
    });
  });
});

describe("chartDataOf", () => {
  it("carries the formats, writes gaps and adds the compare columns", () => {
    expect(
      chartDataOf({
        data: [{ m: "Jan", a: 1, b: Number.POSITIVE_INFINITY, a0: 2 }, { a: "x" }],
        series: [
          { key: "a", label: "A", compareKey: "a0" },
          { key: "b", label: "B" },
        ],
        categoryKey: "m",
        categoryLabel: "Month",
        compareLabelOf: (series) => `${series.label} before`,
        categoryFormat: { month: "short" },
        valueFormat: { style: "percent" },
      }),
    ).toEqual({
      categoryFormat: { month: "short" },
      valueFormat: { style: "percent" },
      head: ["Month", "A", "B", "A before"],
      rows: [
        ["Jan", 1, null, 2],
        [null, null, null, null],
      ],
    });
  });
});

describe("chartReferenceTextOf", () => {
  it.each([
    [{ value: 1200, label: "Target" }, "Target: 1,200"],
    [{ value: 5 }, "5"],
    [{ from: 10, to: 20, label: "Normal" }, "Normal: 10–20"],
    [{ to: 20 }, "0–20"],
    [{ from: 3 }, "3–0"],
  ])("writes %o as %j", (reference, expected) => {
    expect(chartReferenceTextOf(reference, "en")).toBe(expected);
  });

  it("formats in the locale and the value format", () => {
    expect(chartReferenceTextOf({ value: 0.5 }, "ar-EG", { style: "percent" })).toBe("٥٠٪؜");
  });
});

describe("choroplethShapesOf", () => {
  const square = [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ],
  ];

  it("gives no shapes when no region has a polygon", () => {
    const empty: GeoFeatureCollection = {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: null, geometry: null }],
    };
    expect(choroplethShapesOf(empty, { width: 100, height: 100, values: {} })).toEqual([]);
  });

  it("names a region with no properties by its index and reads only finite values", () => {
    const shapes = choroplethShapesOf(
      {
        type: "FeatureCollection",
        features: [
          { type: "Feature", properties: null, geometry: { type: "Polygon", coordinates: square } },
          {
            type: "Feature",
            properties: { code: "b", title: "Bee" },
            geometry: { type: "MultiPolygon", coordinates: [square] },
          },
        ],
      },
      {
        width: 100,
        height: 100,
        idKey: "code",
        nameKey: "title",
        values: { "0": Number.NaN, b: 2 },
      },
    );
    expect(shapes.map((shape) => [shape.id, shape.name, shape.value])).toEqual([
      ["0", "0", null],
      ["b", "Bee", 2],
    ]);
    expect(shapes[0]?.path).toMatch(/^M .* Z$/);
  });
});

describe("meterSharesOf", () => {
  it("gives zero shares for nothing to show, and clamps negatives", () => {
    expect(meterSharesOf([])).toEqual({ shares: [], free: 0, total: 0 });
    expect(
      meterSharesOf([
        { key: "a", label: "A", value: -3 },
        { key: "b", label: "B", value: 0 },
      ]),
    ).toEqual({
      shares: [0, 0],
      free: 0,
      total: 0,
    });
    expect(
      meterSharesOf(
        [
          { key: "a", label: "A", value: 1 },
          { key: "b", label: "B", value: 1 },
        ],
        4,
      ),
    ).toEqual({
      shares: [0.25, 0.25],
      free: 0.5,
      total: 2,
    });
  });
});

describe("timelineLayoutOf", () => {
  const rows = [{ key: "r", label: "Row" }];

  it("is empty with no task in a known row or ending after its start", () => {
    const empty = { from: 0, to: 0, unit: "week", ticks: [], bars: [], today: null };
    expect(timelineLayoutOf(rows, [])).toEqual(empty);
    expect(
      timelineLayoutOf(rows, [
        { key: "t", rowKey: "x", label: "T", start: "2026-01-01", end: "2026-01-02" },
        { key: "u", rowKey: "r", label: "U", start: "2026-01-05", end: "2026-01-01" },
      ]),
    ).toEqual(empty);
  });

  it("leaves today out when it falls outside the span", () => {
    const layout = timelineLayoutOf(
      rows,
      [{ key: "t", rowKey: "r", label: "T", start: "2026-01-05", end: "2026-01-06" }],
      "2027-01-01",
    );
    expect(layout.today).toBeNull();
    expect(layout.bars[0]?.row).toBe(0);
  });
});

describe("treemapLayoutOf", () => {
  it("keeps the caller's order when asked, and drops empty items", () => {
    const items = [
      { key: "s", label: "S", value: 1 },
      { key: "z", label: "Z", value: 0 },
      { key: "l", label: "L", value: 3 },
    ];
    expect(treemapLayoutOf(items, 1, true).map((tile) => tile.item.key)).toEqual(["s", "l"]);
    expect(treemapLayoutOf(items).map((tile) => tile.item.key)).toEqual(["l", "s"]);
    expect(treemapLayoutOf([{ key: "z", label: "Z", value: 0 }])).toEqual([]);
  });
});

describe("sunburstValueOf", () => {
  it("sums a parent's children, skipping negatives, and reads a leaf with no value as zero", () => {
    expect(
      sunburstValueOf({
        key: "root",
        label: "Root",
        children: [
          { key: "a", label: "A", value: 2 },
          { key: "b", label: "B", value: -5 },
          { key: "c", label: "C", children: [{ key: "d", label: "D", value: 3 }] },
          { key: "e", label: "E" },
        ],
      }),
    ).toBe(5);
  });
});
