/**
 * Stackra file contract:
 * Purpose: `chordLayoutOf`, a chord diagram round a centre: each group takes an arc of the ring as long as all that
 *          leaves and reaches it, clockwise from the top with a small gap between groups; each flow is a ribbon from a
 *          stretch of its source's arc (as wide as the flow) to a stretch of its target's, bowed through the middle.
 * Boundary: pure. Flows to unknown groups and non-positive flows are left out. Like a pie, it is never mirrored.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same layout on web and native); STA-1371.
 */
import type { SankeyLink } from "#contracts/types/sankey-link.type";
import type { SankeyNode } from "#contracts/types/sankey-node.type";
import { arcPathOf } from "#core/functions/arc-path-of.function";
import type { ChordLayout } from "#core/types/chord-layout.type";

/** The gap between two groups' arcs, in radians. */
const GAP = 0.04;

/** The ring round the centre. */
interface ChordRing {
  readonly cx: number;
  readonly cy: number;
  /** The ribbons' radius, where the ring starts. */
  readonly inner: number;
  /** The ring's outer radius. */
  readonly outer: number;
}

/**
 * The arcs and ribbons of a chord diagram.
 * @example chordLayoutOf([{ key: "a", label: "A" }, { key: "b", label: "B" }], [{ source: "a", target: "b", value: 3 }], { cx: 50, cy: 50, inner: 36, outer: 40 });
 */
export function chordLayoutOf(
  nodes: readonly SankeyNode[],
  links: readonly SankeyLink[],
  ring: ChordRing,
): ChordLayout {
  const { cx, cy, inner, outer } = ring;
  const position = new Map(nodes.map((node, index) => [node.key, index]));
  const flows = links.filter(
    (link) => link.value > 0 && position.has(link.source) && position.has(link.target),
  );
  const value = nodes.map((_, index) =>
    flows.reduce(
      (sum, link) =>
        sum +
        (position.get(link.source) === index ? link.value : 0) +
        (position.get(link.target) === index ? link.value : 0),
      0,
    ),
  );
  const total = value.reduce((sum, figure) => sum + figure, 0);
  const shown = value.filter((figure) => figure > 0).length;
  const gap = shown > 1 ? GAP : 0;
  const scale = total > 0 ? (Math.PI * 2 - gap * shown) / total : 0;
  let angle = 0;
  const groups = nodes.map((node, index) => {
    const start = angle;
    const end = start + (value[index] ?? 0) * scale;
    angle = (value[index] ?? 0) > 0 ? end + gap : end;
    return { node, index, start, end, value: value[index] ?? 0, path: arcPathOf(cx, cy, inner, outer, start, end) };
  });
  // Each group's next free angle: its flows out first, then its flows in, in the caller's order.
  const cursor = groups.map((group) => group.start);
  const take = (index: number, size: number) => {
    const from = cursor[index] ?? 0;
    cursor[index] = from + size;
    return [from, from + size] as const;
  };
  const outs = flows.map((link) => take(position.get(link.source) ?? 0, link.value * scale));
  const ins = flows.map((link) => take(position.get(link.target) ?? 0, link.value * scale));
  const point = (theta: number) =>
    `${(cx + inner * Math.sin(theta)).toFixed(2)} ${(cy - inner * Math.cos(theta)).toFixed(2)}`;
  const arc = (from: number, to: number) =>
    `A ${inner} ${inner} 0 ${to - from > Math.PI ? 1 : 0} 1 ${point(to)}`;
  const centre = `${cx.toFixed(2)} ${cy.toFixed(2)}`;
  return {
    groups,
    ribbons: flows.map((link, index) => {
      const [a0, a1] = outs[index] ?? [0, 0];
      const [b0, b1] = ins[index] ?? [0, 0];
      return {
        link,
        sourceIndex: position.get(link.source) ?? 0,
        path: `M ${point(a0)} ${arc(a0, a1)} Q ${centre} ${point(b0)} ${arc(b0, b1)} Q ${centre} ${point(a0)} Z`,
      };
    }),
  };
}
