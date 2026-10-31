/**
 * Stackra file contract:
 * Purpose: `networkLayoutOf`, a network graph laid out in a `width` × `height` box by a force layout run to rest
 *          (Fruchterman–Reingold): nodes push each other apart, links pull their ends together, a light pull holds
 *          loose parts near the middle; then the drawing is fitted to the box. A node's radius follows its value (its
 *          link count by default), a link's width its value. Right to left, the picture is mirrored.
 * Boundary: pure and deterministic: nodes start on a golden-angle spiral and the run is a fixed number of steps, so
 *           the same data draws the same graph on every render and runtime. Links to unknown nodes are left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same layout on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import type { NetworkLink } from "#contracts/types/network-link.type";
import type { NetworkNode } from "#contracts/types/network-node.type";
import type { NetworkLayout } from "#core/types/network-layout.type";

/** The force run's steps; enough for a few hundred nodes to settle. */
const STEPS = 300;
/** The smallest and largest node radius. */
const RADIUS = [5, 14] as const;
/** The thinnest and thickest link. */
const STROKE = [1, 4] as const;

/** The lowest and highest of some numbers. */
const span = (values: readonly number[]) => [Math.min(...values), Math.max(...values)] as const;

/** What the layout reads beyond the data. */
interface NetworkBox {
  readonly width: number;
  readonly height: number;
  /** Room kept free at each edge for the largest node and the labels under the nodes; 32 by default. */
  readonly padding?: number;
  readonly isRtl?: boolean;
}

/**
 * The circles and lines of a network graph.
 * @example networkLayoutOf([{ key: "a", label: "A" }, { key: "b", label: "B" }], [{ source: "a", target: "b" }], { width: 300, height: 200 });
 */
export function networkLayoutOf(
  nodes: readonly NetworkNode[],
  links: readonly NetworkLink[],
  box: NetworkBox,
): NetworkLayout {
  const { width, height, padding = 32, isRtl = false } = box;
  const position = new Map(nodes.map((node, index) => [node.key, index]));
  const kept = links.filter(
    (link) =>
      position.has(link.source) && position.has(link.target) && link.source !== link.target,
  );
  const ends = kept.map((link) => [position.get(link.source) ?? 0, position.get(link.target) ?? 0]);
  const count = nodes.length;
  // The unit box is [-1, 1] on both axes; k is the ideal distance between neighbours.
  const k = 2 / Math.sqrt(Math.max(1, count));
  const xs = nodes.map((_, index) => Math.sqrt((index + 0.5) / count) * Math.cos(index * 2.39996));
  const ys = nodes.map((_, index) => Math.sqrt((index + 0.5) / count) * Math.sin(index * 2.39996));
  for (let step = 0; step < STEPS; step += 1) {
    const heat = 0.1 * (1 - step / STEPS) + 0.002;
    const dx = nodes.map(() => 0);
    const dy = nodes.map(() => 0);
    for (let a = 0; a < count; a += 1) {
      for (let b = a + 1; b < count; b += 1) {
        const ox = (xs[a] ?? 0) - (xs[b] ?? 0);
        const oy = (ys[a] ?? 0) - (ys[b] ?? 0);
        const distance = Math.max(1e-3, Math.hypot(ox, oy));
        const push = (k * k) / distance / distance;
        dx[a] = (dx[a] ?? 0) + ox * push;
        dy[a] = (dy[a] ?? 0) + oy * push;
        dx[b] = (dx[b] ?? 0) - ox * push;
        dy[b] = (dy[b] ?? 0) - oy * push;
      }
    }
    for (const [a = 0, b = 0] of ends) {
      const ox = (xs[a] ?? 0) - (xs[b] ?? 0);
      const oy = (ys[a] ?? 0) - (ys[b] ?? 0);
      const pull = Math.hypot(ox, oy) / k;
      dx[a] = (dx[a] ?? 0) - ox * pull;
      dy[a] = (dy[a] ?? 0) - oy * pull;
      dx[b] = (dx[b] ?? 0) + ox * pull;
      dy[b] = (dy[b] ?? 0) + oy * pull;
    }
    for (let index = 0; index < count; index += 1) {
      // A light pull to the middle keeps a loose node or a separate cluster from drifting off.
      const fx = (dx[index] ?? 0) - (xs[index] ?? 0) * 0.5;
      const fy = (dy[index] ?? 0) - (ys[index] ?? 0) * 0.5;
      const length = Math.max(1e-9, Math.hypot(fx, fy));
      const move = Math.min(length, heat);
      xs[index] = (xs[index] ?? 0) + (fx / length) * move;
      ys[index] = (ys[index] ?? 0) + (fy / length) * move;
    }
  }
  const [x0, x1] = count > 0 ? span(xs) : [0, 0];
  const [y0, y1] = count > 0 ? span(ys) : [0, 0];
  const fit = (value: number, low: number, high: number, size: number) =>
    high - low < 1e-6 ? size / 2 : padding + ((value - low) / (high - low)) * (size - padding * 2);
  const degree = nodes.map(
    (_, index) => ends.filter(([a, b]) => a === index || b === index).length,
  );
  const size = nodes.map((node, index) => node.value ?? degree[index] ?? 0);
  const largest = Math.max(1, ...size);
  const strongest = Math.max(1, ...kept.map((link) => link.value ?? 1));
  const groups = [...new Set(nodes.flatMap((node) => (node.group ? [node.group] : [])))];
  const placed = nodes.map((node, index) => {
    const x = fit(xs[index] ?? 0, x0, x1, width);
    return {
      node,
      colorIndex: groups.length > 0 ? Math.max(0, groups.indexOf(node.group ?? "")) : index,
      x: isRtl ? width - x : x,
      y: fit(ys[index] ?? 0, y0, y1, height),
      radius: RADIUS[0] + (RADIUS[1] - RADIUS[0]) * Math.sqrt(Math.max(0, size[index] ?? 0) / largest),
      degree: degree[index] ?? 0,
    };
  });
  return {
    nodes: placed,
    links: kept.map((link, index) => {
      const [a = 0, b = 0] = ends[index] ?? [];
      return {
        link,
        sourceIndex: a,
        targetIndex: b,
        x1: placed[a]?.x ?? 0,
        y1: placed[a]?.y ?? 0,
        x2: placed[b]?.x ?? 0,
        y2: placed[b]?.y ?? 0,
        width: STROKE[0] + (STROKE[1] - STROKE[0]) * ((link.value ?? 1) / strongest),
      };
    }),
  };
}
