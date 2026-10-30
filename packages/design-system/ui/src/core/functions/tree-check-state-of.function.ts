/**
 * Stackra file contract:
 * Purpose: `treeCheckStateOf(node, checked)`, how a TreeView row's checkbox reads when checks propagate: `on` when it
 *          (or, for a parent, every row under it) is checked, `some` when only part of its rows are, `off` otherwise.
 * Boundary: pure; a row whose children are not loaded reads from its own id.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C, owner request 2026-10-29).
 */
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";

/** The checkbox state of `node` against the checked ids. */
export function treeCheckStateOf(
  node: TreeViewNode,
  checked: ReadonlySet<string>,
): "on" | "off" | "some" {
  const children = node.children ?? [];
  if (children.length === 0) return checked.has(node.id) ? "on" : "off";
  const states = children.map((child) => treeCheckStateOf(child, checked));
  if (states.every((state) => state === "on")) return "on";
  return states.some((state) => state !== "off") ? "some" : "off";
}
