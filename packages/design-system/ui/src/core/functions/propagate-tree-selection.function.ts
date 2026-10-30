/**
 * Stackra file contract:
 * Purpose: `propagateTreeSelection(items, previous, next)`, a TreeView's checked ids after one change when checks
 *          propagate: a row checked or unchecked takes every enabled row under it along, and then each parent is
 *          checked exactly when all its rows are. Shared by the web and native TreeView.
 * Boundary: pure; ids come back in the order the rows are listed. A row whose children are not loaded is a leaf.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C, owner request 2026-10-29).
 */
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";

/** The checked ids after `previous` became `next`, with the change carried down and up the tree. */
export function propagateTreeSelection(
  items: readonly TreeViewNode[],
  previous: readonly string[],
  next: readonly string[],
): string[] {
  const order: string[] = [];
  const byId = new Map<string, TreeViewNode>();
  const index = (nodes: readonly TreeViewNode[]): void => {
    for (const node of nodes) {
      order.push(node.id);
      byId.set(node.id, node);
      index(node.children ?? []);
    }
  };
  index(items);

  const before = new Set(previous);
  const after = new Set(next);
  const on = new Set(previous);
  const apply = (node: TreeViewNode | undefined, isOn: boolean): void => {
    if (!node || node.isDisabled) return;
    if (isOn) on.add(node.id);
    else on.delete(node.id);
    for (const child of node.children ?? []) apply(child, isOn);
  };
  for (const id of after) if (!before.has(id)) apply(byId.get(id), true);
  for (const id of before) if (!after.has(id)) apply(byId.get(id), false);

  const settle = (node: TreeViewNode): boolean => {
    const children = node.children ?? [];
    if (children.length === 0) return on.has(node.id);
    // Every child settles, so `every` must not stop at the first unchecked one.
    const all = children.map(settle).every(Boolean);
    if (all) on.add(node.id);
    else on.delete(node.id);
    return all;
  };
  for (const node of items) settle(node);

  return order.filter((id) => on.has(id));
}
