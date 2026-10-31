/**
 * Stackra file contract:
 * Purpose: `treeLayoutOf`, a tree diagram laid out in a `width` × `height` box: each level is a column from the reading
 *          start, leaves share the height evenly in reading order, and a parent sits midway between its first and last
 *          child; each link is a curve from the parent to the child. Right to left, the levels run from the right.
 * Boundary: pure. `labelRoom` is kept free after the last column for the leaves' labels. A value is a node's own, or
 *           the sum of its children's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same layout on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import type { TreeDiagramItem } from "#contracts/types/tree-diagram-item.type";
import type { TreeLayout } from "#core/types/tree-layout.type";

/** A coordinate written short. */
const n = (figure: number) => figure.toFixed(2);

/** What the layout reads beyond the data. */
interface TreeBox {
  readonly width: number;
  readonly height: number;
  /** Room kept at the reading start for the top node and at the end for the leaves' labels; 8 and 120 by default. */
  readonly padding?: number;
  readonly labelRoom?: number;
  readonly isRtl?: boolean;
}

/** An item's value: its own, or its children's summed; undefined when none below it has one. */
function valueOf(item: TreeDiagramItem): number | undefined {
  if (item.value !== undefined) return item.value;
  const values = (item.children ?? []).map(valueOf).filter((value) => value !== undefined);
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : undefined;
}

/**
 * The points and curves of a tree diagram.
 * @example treeLayoutOf([{ key: "r", label: "Root", children: [{ key: "a", label: "A" }] }], { width: 300, height: 100 });
 */
export function treeLayoutOf(items: readonly TreeDiagramItem[], box: TreeBox): TreeLayout {
  const { width, height, padding = 8, labelRoom = 120, isRtl = false } = box;
  const flat: {
    item: TreeDiagramItem;
    trail: string[];
    depth: number;
    branch: number;
    parent: number;
  }[] = [];
  const isLone = items.length === 1;
  const walk = (
    item: TreeDiagramItem,
    trail: string[],
    depth: number,
    branch: number,
    parent: number,
  ) => {
    const at = flat.length;
    flat.push({ item, trail: [...trail, item.label], depth, branch, parent });
    (item.children ?? []).forEach((child, index) =>
      walk(child, [...trail, item.label], depth + 1, branch === -1 ? index : branch, at),
    );
  };
  items.forEach((item, index) => walk(item, [], 0, isLone ? -1 : index, -1));
  const depth = Math.max(0, ...flat.map((node) => node.depth)) + 1;
  const leaves = flat.filter((node) => (node.item.children ?? []).length === 0);
  const slot = height / Math.max(1, leaves.length);
  const ys = flat.map(() => 0);
  leaves.forEach((leaf) => {
    ys[flat.indexOf(leaf)] = slot * (leaves.indexOf(leaf) + 0.5);
  });
  // Deepest first, so every parent reads its children's final points.
  for (let at = flat.length - 1; at >= 0; at -= 1) {
    const kids = flat.flatMap((node, index) => (node.parent === at ? [index] : []));
    if (kids.length > 0) ys[at] = ((ys[kids[0] ?? 0] ?? 0) + (ys[kids.at(-1) ?? 0] ?? 0)) / 2;
  }
  const step = depth > 1 ? (width - padding - labelRoom) / (depth - 1) : 0;
  const xOf = (level: number) => {
    const x = depth > 1 ? padding + level * step : padding;
    return isRtl ? width - x : x;
  };
  const nodes = flat.map((node, index) => ({
    item: node.item,
    trail: node.trail,
    depth: node.depth,
    branch: node.branch,
    x: xOf(node.depth),
    y: ys[index] ?? 0,
    value: valueOf(node.item),
    isLeaf: (node.item.children ?? []).length === 0,
  }));
  return {
    depth,
    nodes,
    links: flat.flatMap((node, index) => {
      const parent = nodes[node.parent];
      const child = nodes[index];
      if (!parent || !child) return [];
      const xm = (parent.x + child.x) / 2;
      return [
        {
          key: `${parent.item.key}-${child.item.key}`,
          branch: node.branch,
          path: `M ${n(parent.x)} ${n(parent.y)} C ${n(xm)} ${n(parent.y)} ${n(xm)} ${n(child.y)} ${n(child.x)} ${n(child.y)}`,
        },
      ];
    }),
  };
}
