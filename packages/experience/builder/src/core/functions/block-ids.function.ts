/**
 * Stackra file contract:
 * Purpose: `blockIds(node)`, every block id in a subtree, the node's own included.
 * Boundary: a pure function, internal to the core entry; depth-first, so a tree within `MAX_DOCUMENT_DEPTH` is safe.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4).
 */
import type { EditorNode } from "#contracts/index";

/**
 * The ids of `node` and every block nested in it.
 *
 * @example
 * blockIds(root).has(hero.id); // true while hero is in the tree
 */
export function blockIds(node: EditorNode, into: Set<string> = new Set()): Set<string> {
  into.add(node.id);
  for (const child of node.children) blockIds(child, into);
  return into;
}
