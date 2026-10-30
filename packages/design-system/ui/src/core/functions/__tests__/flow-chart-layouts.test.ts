/**
 * Stackra file contract:
 * Purpose: proves the layouts of the sankey, sunburst, timeline and choropleth charts and their shared helpers: arcs
 *          run clockwise from the top, levels split a range in five, sankey columns follow the longest chain and
 *          mirror right to left, sunburst rings split their parent's angle, timeline spans round to months or weeks,
 *          and a map fits its box with its aspect kept.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
import { arcPathOf } from "#core/functions/arc-path-of.function";
import { choroplethShapesOf } from "#core/functions/choropleth-shapes-of.function";
import { sankeyLayoutOf } from "#core/functions/sankey-layout-of.function";
import { sunburstLayoutOf } from "#core/functions/sunburst-layout-of.function";
import { timelineLayoutOf } from "#core/functions/timeline-layout-of.function";
import { valueLevelOf } from "#core/functions/value-level-of.function";

/** A one-degree square ring starting at `lon`. */
const square = (lon: number) => [
  [
    [lon, 0],
    [lon + 1, 0],
    [lon + 1, 1],
    [lon, 1],
    [lon, 0],
  ],
];

describe("arcPathOf", () => {
  it("draws a wedge from the centre and a ring slice between two radii, clockwise from the top", () => {
    expect(arcPathOf(50, 50, 0, 40, 0, Math.PI / 2)).toBe(
      "M 50.00 50.00 L 50.00 10.00 A 40 40 0 0 1 90.00 50.00 Z",
    );
    expect(arcPathOf(50, 50, 20, 40, 0, Math.PI)).toBe(
      "M 50.00 10.00 A 40 40 0 0 1 50.00 90.00 L 50.00 70.00 A 20 20 0 0 0 50.00 30.00 Z",
    );
    // A whole turn stops a hair short, so the arc still has two distinct ends.
    expect(arcPathOf(0, 0, 0, 10, 0, Math.PI * 2)).toContain(" 0 1 1 ");
  });
});

describe("valueLevelOf", () => {
  it("splits the range in five steps and puts every value at the top when there is no spread", () => {
    expect([0, 19, 20, 50, 99, 100].map((value) => valueLevelOf(value, 0, 100))).toEqual([
      0, 0, 1, 2, 4, 4,
    ]);
    expect(valueLevelOf(7, 7, 7)).toBe(4);
  });
});

describe("sankeyLayoutOf", () => {
  const nodes = [
    { key: "visit", label: "Visit" },
    { key: "cart", label: "Cart" },
    { key: "paid", label: "Paid" },
    { key: "left", label: "Left" },
  ];
  const links = [
    { source: "visit", target: "cart", value: 60 },
    { source: "visit", target: "left", value: 40 },
    { source: "cart", target: "paid", value: 45 },
    { source: "cart", target: "left", value: 15 },
    { source: "ghost", target: "paid", value: 5 },
  ];

  it("puts each node in the column of its longest chain and sizes it by its flow", () => {
    const layout = sankeyLayoutOf(nodes, links, { width: 300, height: 120, gap: 10 });
    expect(layout.columns).toBe(3);
    expect(layout.nodes.map((node) => node.column)).toEqual([0, 1, 2, 2]);
    expect(layout.nodes.map((node) => node.value)).toEqual([100, 60, 45, 55]);
    // The fullest column (two nodes, 100 in all) fills the height less one gap.
    const [paid, left] = [layout.nodes[2], layout.nodes[3]];
    expect((paid?.height ?? 0) + (left?.height ?? 0)).toBeCloseTo(110);
    expect(layout.nodes[0]?.x).toBe(0);
    expect(layout.links).toHaveLength(4);
  });

  it("runs from the right in Arabic", () => {
    const layout = sankeyLayoutOf(nodes, links, {
      width: 300,
      height: 120,
      nodeWidth: 10,
      isRtl: true,
    });
    expect(layout.nodes[0]?.x).toBe(290);
    expect(layout.links[0]?.path.startsWith("M 290.00 ")).toBe(true);
  });
});

describe("sunburstLayoutOf", () => {
  it("splits each ring by value inside its parent's angle and keeps the branch's colour", () => {
    const arcs = sunburstLayoutOf([
      {
        key: "drinks",
        label: "Drinks",
        children: [
          { key: "coffee", label: "Coffee", value: 30 },
          { key: "tea", label: "Tea", value: 10 },
        ],
      },
      { key: "food", label: "Food", value: 40 },
      { key: "none", label: "None", value: 0 },
    ]);
    expect(arcs.map((arc) => [arc.item.key, arc.depth, arc.branch])).toEqual([
      ["drinks", 0, 0],
      ["coffee", 1, 0],
      ["tea", 1, 0],
      ["food", 0, 1],
    ]);
    expect(arcs[0]?.end).toBeCloseTo(Math.PI);
    expect(arcs[2]?.start).toBeCloseTo((Math.PI * 3) / 4);
    expect(arcs[2]?.trail).toEqual(["Drinks", "Tea"]);
  });
});

describe("timelineLayoutOf", () => {
  const rows = [
    { key: "design", label: "Design" },
    { key: "build", label: "Build" },
  ];

  it("rounds a long plan out to months and places bars and today as shares", () => {
    const layout = timelineLayoutOf(
      rows,
      [
        { key: "a", rowKey: "design", label: "Brief", start: "2026-10-05", end: "2026-10-30" },
        { key: "b", rowKey: "build", label: "Build", start: "2026-11-02", end: "2026-12-18" },
        { key: "x", rowKey: "nowhere", label: "Lost", start: "2026-10-01", end: "2026-10-02" },
      ],
      "2026-11-15",
    );
    expect(layout.unit).toBe("month");
    expect(layout.ticks.map((tick) => new Date(tick.date).toISOString().slice(0, 10))).toEqual([
      "2026-10-01",
      "2026-11-01",
      "2026-12-01",
    ]);
    expect(layout.bars.map((bar) => bar.row)).toEqual([0, 1]);
    expect(layout.bars[0]?.at).toBeCloseTo(4 / 92);
    expect(layout.bars[0]?.length).toBeCloseTo(26 / 92);
    expect(layout.today).toBeCloseTo(45.5 / 92);
  });

  it("uses Monday weeks for a short plan and leaves today out when it falls outside", () => {
    const layout = timelineLayoutOf(
      rows,
      [{ key: "a", rowKey: "design", label: "Sprint", start: "2026-11-04", end: "2026-11-17" }],
      "2027-01-01",
    );
    expect(layout.unit).toBe("week");
    expect(new Date(layout.from).toISOString().slice(0, 10)).toBe("2026-11-02");
    expect(layout.ticks).toHaveLength(3);
    expect(layout.today).toBeNull();
  });
});

describe("choroplethShapesOf", () => {
  const collection = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { id: "a", name: "North" },
        geometry: { type: "Polygon" as const, coordinates: square(0) },
      },
      {
        type: "Feature" as const,
        properties: { id: "b" },
        geometry: { type: "MultiPolygon" as const, coordinates: [square(1)] },
      },
      { type: "Feature" as const, properties: { id: "c" }, geometry: null },
    ],
  };

  it("fits the regions to the box with their aspect kept and reads ids, names and values", () => {
    const shapes = choroplethShapesOf(collection, {
      width: 200,
      height: 200,
      padding: 0,
      values: { a: 3 },
    });
    expect(shapes.map((shape) => [shape.id, shape.name, shape.value])).toEqual([
      ["a", "North", 3],
      ["b", "b", null],
    ]);
    // Two unit squares side by side, 2 wide and 1 tall, fill the width and centre in the height.
    expect(shapes[0]?.path).toBe("M 0.0 150.0 L 100.0 150.0 L 100.0 50.0 L 0.0 50.0 L 0.0 150.0 Z");
  });
});
