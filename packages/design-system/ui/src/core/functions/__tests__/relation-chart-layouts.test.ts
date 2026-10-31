/**
 * Stackra file contract:
 * Purpose: proves the layouts of the network graph, tree diagram, word cloud and chord diagram: the force layout is
 *          deterministic, stays in its box, keeps linked nodes closer than unlinked ones and mirrors right to left;
 *          tree levels run from the reading start with parents between their children; words never overlap and the
 *          heaviest is largest; chord arcs share the turn by flow with ribbons for each flow.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
import { chordLayoutOf } from "#core/functions/chord-layout-of.function";
import { networkLayoutOf } from "#core/functions/network-layout-of.function";
import { treeLayoutOf } from "#core/functions/tree-layout-of.function";
import { wordCloudLayoutOf } from "#core/functions/word-cloud-layout-of.function";

const NODES = ["a", "b", "c", "d", "e", "f"].map((key) => ({ key, label: key.toUpperCase() }));
const LINKS = [
  { source: "a", target: "b" },
  { source: "b", target: "c" },
  { source: "a", target: "c" },
  { source: "d", target: "e" },
  { source: "e", target: "f" },
  { source: "a", target: "zz" },
];

describe("networkLayoutOf", () => {
  const box = { width: 400, height: 300 };
  const layout = networkLayoutOf(NODES, LINKS, box);

  it("is the same every run, keeps to its box and drops links to unknown nodes", () => {
    expect(networkLayoutOf(NODES, LINKS, box)).toEqual(layout);
    expect(layout.links).toHaveLength(5);
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(32);
      expect(node.x).toBeLessThanOrEqual(368);
      expect(node.y).toBeGreaterThanOrEqual(32);
      expect(node.y).toBeLessThanOrEqual(268);
    }
  });

  const at = (key: string) => layout.nodes.find((node) => node.node.key === key);
  const gap = (one: string, two: string) =>
    Math.hypot((at(one)?.x ?? 0) - (at(two)?.x ?? 0), (at(one)?.y ?? 0) - (at(two)?.y ?? 0));

  it("keeps linked nodes closer than unlinked ones and sizes nodes by their links", () => {
    expect(gap("a", "b")).toBeLessThan(gap("a", "f"));
    expect(at("a")?.degree).toBe(2);
    expect(at("a")?.radius).toBeGreaterThan(at("d")?.radius ?? 0);
  });

  it("colours by group and mirrors right to left", () => {
    const grouped = networkLayoutOf(
      NODES.map((node, index) => ({ ...node, group: index < 3 ? "x" : "y" })),
      LINKS,
      box,
    );
    expect(grouped.nodes.map((node) => node.colorIndex)).toEqual([0, 0, 0, 1, 1, 1]);
    const mirrored = networkLayoutOf(NODES, LINKS, { ...box, isRtl: true });
    expect(mirrored.nodes[0]?.x).toBeCloseTo(400 - (layout.nodes[0]?.x ?? 0));
  });
});

describe("treeLayoutOf", () => {
  const items = [
    {
      key: "r",
      label: "Root",
      children: [
        { key: "a", label: "A", children: [{ key: "a1", label: "A1", value: 2 }, { key: "a2", label: "A2", value: 3 }] },
        { key: "b", label: "B", value: 4 },
      ],
    },
  ];

  it("runs levels from the reading start and puts a parent between its children", () => {
    const layout = treeLayoutOf(items, { width: 300, height: 90, padding: 0, labelRoom: 0 });
    const at = (key: string) => layout.nodes.find((node) => node.item.key === key);
    expect(layout.depth).toBe(3);
    expect([at("r")?.x, at("a")?.x, at("a1")?.x]).toEqual([0, 150, 300]);
    expect([at("a1")?.y, at("a2")?.y, at("b")?.y]).toEqual([15, 45, 75]);
    expect(at("a")?.y).toBe(30);
    expect(at("r")?.value).toBe(9);
    expect(at("a1")?.trail).toEqual(["Root", "A", "A1"]);
    expect([at("r")?.branch, at("a2")?.branch, at("b")?.branch]).toEqual([-1, 0, 1]);
    expect(layout.links).toHaveLength(4);
  });

  it("runs from the right in Arabic", () => {
    const layout = treeLayoutOf(items, { width: 300, height: 90, padding: 0, labelRoom: 0, isRtl: true });
    expect(layout.nodes[0]?.x).toBe(300);
  });
});

describe("wordCloudLayoutOf", () => {
  const words = ["delivery", "price", "fresh", "friendly", "late", "cold", "app", "coupon"].map(
    (text, index) => ({ text, value: 40 - index * 5 }),
  );

  it("sets the heaviest largest, in the middle, and never overlaps two words", () => {
    const layout = wordCloudLayoutOf(words, { width: 600, height: 240 });
    expect(layout.words[0]?.word.text).toBe("delivery");
    expect(layout.words[0]).toMatchObject({ x: 300, y: 120, fontSize: 30 });
    expect(layout.words.at(-1)?.fontSize).toBe(12);
    const boxes = layout.words.map((word) => ({
      x0: word.x - (word.word.text.length * 0.6 * word.fontSize) / 2,
      x1: word.x + (word.word.text.length * 0.6 * word.fontSize) / 2,
      y0: word.y - (1.1 * word.fontSize) / 2,
      y1: word.y + (1.1 * word.fontSize) / 2,
    }));
    boxes.forEach((one, index) =>
      boxes.slice(index + 1).forEach((two) => {
        const overlaps = one.x0 < two.x1 && one.x1 > two.x0 && one.y0 < two.y1 && one.y1 > two.y0;
        expect(overlaps).toBe(false);
      }),
    );
    expect(layout.dropped + layout.words.length).toBe(8);
  });

  it("drops what does not fit and leaves out non-positive words", () => {
    const layout = wordCloudLayoutOf([...words, { text: "none", value: 0 }], { width: 120, height: 40 });
    expect(layout.words.length + layout.dropped).toBe(8);
    expect(layout.dropped).toBeGreaterThan(0);
  });
});

describe("chordLayoutOf", () => {
  it("shares the turn by flow, clockwise from the top, with a ribbon per flow", () => {
    const layout = chordLayoutOf(
      [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
        { key: "c", label: "C" },
      ],
      [
        { source: "a", target: "b", value: 2 },
        { source: "b", target: "a", value: 1 },
        { source: "a", target: "x", value: 5 },
      ],
      { cx: 50, cy: 50, inner: 36, outer: 40 },
    );
    expect(layout.groups.map((group) => group.value)).toEqual([3, 3, 0]);
    expect(layout.groups[0]?.start).toBe(0);
    expect((layout.groups[0]?.end ?? 0) - (layout.groups[0]?.start ?? 0)).toBeCloseTo(
      Math.PI - 0.04,
    );
    expect(layout.ribbons).toHaveLength(2);
    expect(layout.ribbons[0]?.path).toMatch(/^M 50\.00 14\.00 A 36 36 0 0 1 .* Q 50\.00 50\.00 .* Z$/);
  });
});
