/**
 * Stackra file contract:
 * Purpose: `cascadeColumnsOf(items, path, loaded)`, what a Cascader shows for an open path: the columns of rows (the
 *          top rows, then the rows under each step of the path that has any) and the rows the path names, in order.
 * Boundary: pure; a row's rows are its `children`, or the ones loaded for it through `onLoadChildren`. A path step that
 *           names no row ends the path there.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { TreeViewNode } from "#contracts/types/tree-view-node.type";

/** Nothing loaded yet. */
const NOTHING_LOADED: ReadonlyMap<string, readonly TreeViewNode[]> = new Map();

/** The columns and the named rows of `path` through `items`. */
export function cascadeColumnsOf(
  items: readonly TreeViewNode[],
  path: readonly string[],
  loaded: ReadonlyMap<string, readonly TreeViewNode[]> = NOTHING_LOADED,
): {
  readonly columns: readonly (readonly TreeViewNode[])[];
  readonly nodes: readonly TreeViewNode[];
} {
  const columns: (readonly TreeViewNode[])[] = [items];
  const nodes: TreeViewNode[] = [];
  let rows = items;
  for (const id of path) {
    const node = rows.find((row) => row.id === id);
    if (node === undefined) break;
    nodes.push(node);
    rows = node.children ?? loaded.get(node.id) ?? [];
    if (rows.length === 0) break;
    columns.push(rows);
  }
  return { columns, nodes };
}
