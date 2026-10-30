/**
 * Stackra file contract:
 * Purpose: `moveTreeNodes(items, ids, target)`, a TreeView's rows with the rows `ids` (and what is under them) taken
 *          out and put before or after the target row, or inside it after its own children: what an app calls from
 *          `onMove`.
 * Boundary: pure; returns `items` unchanged when the target is missing or is one of the moved rows or under one.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C, owner request 2026-10-29).
 */
import type { TreeViewDropTarget } from "#contracts/types/tree-view-drop-target.type";
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";

/** The tree with `ids` moved to `target`. */
export function moveTreeNodes(
  items: readonly TreeViewNode[],
  ids: readonly string[],
  target: TreeViewDropTarget,
): readonly TreeViewNode[] {
  const moving = new Set(ids);
  const taken: TreeViewNode[] = [];
  const strip = (nodes: readonly TreeViewNode[]): TreeViewNode[] =>
    nodes.flatMap((node) => {
      if (moving.has(node.id)) {
        taken.push(node);
        return [];
      }
      return [node.children ? { ...node, children: strip(node.children) } : node];
    });
  const rest = strip(items);

  let isPlaced = false;
  const place = (nodes: readonly TreeViewNode[]): TreeViewNode[] =>
    nodes.flatMap((node) => {
      if (node.id === target.id) {
        isPlaced = true;
        if (target.position === "before") return [...taken, node];
        if (target.position === "after") return [node, ...taken];
        return [{ ...node, children: [...(node.children ?? []), ...taken] }];
      }
      return [node.children ? { ...node, children: place(node.children) } : node];
    });
  const moved = place(rest);
  return isPlaced && taken.length > 0 ? moved : items;
}
