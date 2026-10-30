/**
 * Stackra file contract:
 * Purpose: `sankeyLayoutOf`, a sankey chart laid out in a `width` × `height` box: a node's column is the longest chain
 *          of flows reaching it, its height is its flow, the nodes of a column stack with a gap and centre, and each
 *          flow is a band from its source's side to its target's, its ends stacked in the other node's order so
 *          bands cross as little as they can. Right to left, the columns run from the right.
 * Boundary: pure; links to unknown nodes and non-positive values are left out; a cycle is cut at the node count.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same layout on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import type { SankeyLink } from "#contracts/types/sankey-link.type";
import type { SankeyNode } from "#contracts/types/sankey-node.type";
import type { SankeyLayout } from "#core/types/sankey-layout.type";

/** A coordinate written short. */
const n = (figure: number) => figure.toFixed(2);

/** What the layout reads beyond the data. */
interface SankeyBox {
  readonly width: number;
  readonly height: number;
  /** A node's thickness; 12 by default. */
  readonly nodeWidth?: number;
  /** The gap between the nodes of a column; 12 by default. */
  readonly gap?: number;
  readonly isRtl?: boolean;
}

/**
 * The boxes and bands of a sankey chart.
 * @example sankeyLayoutOf([{ key: "a", label: "A" }, { key: "b", label: "B" }], [{ source: "a", target: "b", value: 1 }], { width: 100, height: 50 });
 */
export function sankeyLayoutOf(
  nodes: readonly SankeyNode[],
  links: readonly SankeyLink[],
  box: SankeyBox,
): SankeyLayout {
  const { width, height, nodeWidth = 12, gap = 12, isRtl = false } = box;
  const position = new Map(nodes.map((node, index) => [node.key, index]));
  const flows = links.filter(
    (link) => link.value > 0 && position.has(link.source) && position.has(link.target),
  );
  // Longest chain: relax every flow until nothing moves, at most once per node, so a cycle cannot loop forever.
  const column = nodes.map(() => 0);
  // oxlint-disable-next-line typescript/prefer-for-of -- the loop counts rounds, at most one per node; it does not visit the nodes
  for (let round = 0; round < nodes.length; round += 1) {
    let isMoved = false;
    for (const link of flows) {
      const from = position.get(link.source) ?? 0;
      const to = position.get(link.target) ?? 0;
      if ((column[to] ?? 0) < (column[from] ?? 0) + 1) {
        column[to] = (column[from] ?? 0) + 1;
        isMoved = true;
      }
    }
    if (!isMoved) break;
  }
  const sum = (index: number, side: "source" | "target") =>
    flows.reduce((total, link) => total + (position.get(link[side]) === index ? link.value : 0), 0);
  const value = nodes.map((_, index) => Math.max(sum(index, "source"), sum(index, "target")));
  const columns = Math.max(0, ...column) + 1;
  const members = Array.from({ length: columns }, (_, at) =>
    nodes.map((_node, index) => index).filter((index) => column[index] === at),
  );
  // One scale for every column: the fullest column, gaps included, fills the height.
  const scale = Math.min(
    ...members.map((indexes) => {
      const total = indexes.reduce((all, index) => all + (value[index] ?? 0), 0);
      return total > 0 ? (height - gap * (indexes.length - 1)) / total : Number.POSITIVE_INFINITY;
    }),
  );
  const ky = Number.isFinite(scale) ? Math.max(0, scale) : 0;
  const step = columns > 1 ? (width - nodeWidth) / (columns - 1) : 0;
  const boxes = nodes.map(() => ({ x: 0, y: 0, height: 0 }));
  members.forEach((indexes, at) => {
    const used =
      indexes.reduce((all, index) => all + (value[index] ?? 0) * ky, 0) +
      gap * (indexes.length - 1);
    let y = (height - used) / 2;
    const left = columns > 1 ? at * step : (width - nodeWidth) / 2;
    for (const index of indexes) {
      const tall = (value[index] ?? 0) * ky;
      boxes[index] = { x: isRtl ? width - left - nodeWidth : left, y, height: tall };
      y += tall + gap;
    }
  });
  const outY = boxes.map((node) => node.y);
  const inY = boxes.map((node) => node.y);
  const yOf = (key: string) => boxes[position.get(key) ?? 0]?.y ?? 0;
  // Ends stacked in the other node's vertical order, so bands leave and arrive without crossing at the node.
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const ordered = [...flows].sort(
    (a, b) => yOf(a.target) - yOf(b.target) || yOf(a.source) - yOf(b.source),
  );
  const ends = new Map<SankeyLink, { sy: number; ty: number }>();
  for (const link of ordered) {
    const from = position.get(link.source) ?? 0;
    ends.set(link, { sy: outY[from] ?? 0, ty: 0 });
    outY[from] = (outY[from] ?? 0) + link.value * ky;
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const link of [...flows].sort(
    (a, b) => yOf(a.source) - yOf(b.source) || yOf(a.target) - yOf(b.target),
  )) {
    const to = position.get(link.target) ?? 0;
    const end = ends.get(link);
    if (end) end.ty = inY[to] ?? 0;
    inY[to] = (inY[to] ?? 0) + link.value * ky;
  }
  return {
    columns,
    nodes: nodes.map((node, index) => ({
      node,
      index,
      column: column[index] ?? 0,
      x: boxes[index]?.x ?? 0,
      y: boxes[index]?.y ?? 0,
      width: nodeWidth,
      height: boxes[index]?.height ?? 0,
      value: value[index] ?? 0,
    })),
    links: flows.map((link) => {
      const from = position.get(link.source) ?? 0;
      const to = position.get(link.target) ?? 0;
      const { sy, ty } = ends.get(link) ?? { sy: 0, ty: 0 };
      const thick = link.value * ky;
      // The band leaves the source's reading-end side and reaches the target's reading-start side.
      const x0 = isRtl ? (boxes[from]?.x ?? 0) : (boxes[from]?.x ?? 0) + nodeWidth;
      const x1 = isRtl ? (boxes[to]?.x ?? 0) + nodeWidth : (boxes[to]?.x ?? 0);
      const xm = (x0 + x1) / 2;
      return {
        link,
        sourceIndex: from,
        path:
          `M ${n(x0)} ${n(sy)} C ${n(xm)} ${n(sy)} ${n(xm)} ${n(ty)} ${n(x1)} ${n(ty)} ` +
          `L ${n(x1)} ${n(ty + thick)} C ${n(xm)} ${n(ty + thick)} ${n(xm)} ${n(sy + thick)} ${n(x0)} ${n(sy + thick)} Z`,
      };
    }),
  };
}
