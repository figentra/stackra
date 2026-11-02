/**
 * Stackra file contract:
 * Purpose: `renderTree(nodes, options)`, a tree with branch lines (`├─`, `└─`; ASCII `|-`, `` `- ``): each node's
 *          optional status cell, label, count and dim note. The top level and its children are drawn; deeper levels
 *          only when `expanded` (`--verbose`), else a dim `(+N)` says how many are folded.
 * Boundary: pure; returns the lines.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-010.
 */
import type { TreeNode } from "#contracts/types/tree-node.type";
import { statusCell } from "#core/functions/status-cell.function";
import type { Painter } from "#core/types/painter.type";

/** Nodes under `node`, at every depth. */
const descendants = (node: TreeNode): number =>
  (node.children ?? []).reduce((sum, child) => sum + 1 + descendants(child), 0);

/** The lines of a tree. */
export function renderTree(
  nodes: readonly TreeNode[],
  options: {
    readonly unicode: boolean;
    readonly painter: Painter;
    readonly expanded: boolean;
    readonly bidi?: (text: string) => string;
  },
): string[] {
  const { painter, unicode } = options;
  const bidi = options.bidi ?? String;
  const [branch, last, pipe] = unicode ? ["├─ ", "└─ ", "│  "] : ["|- ", "`- ", "|  "];
  const lines: string[] = [];
  const walk = (level: readonly TreeNode[], prefix: string, depth: number) => {
    for (const [index, node] of level.entries()) {
      const end = index === level.length - 1;
      const open = options.expanded || depth < 1;
      const folded = open ? 0 : descendants(node);
      const parts = [
        ...(node.status === undefined ? [] : [statusCell(node.status, painter, unicode)]),
        bidi(node.label),
        ...(node.count === undefined ? [] : [painter.bold(String(node.count))]),
        ...(node.note === undefined ? [] : [painter.dim(bidi(node.note))]),
        ...(folded === 0 ? [] : [painter.dim(`(+${folded})`)]),
      ];
      lines.push(`  ${prefix}${painter.dim(end ? last : branch)}${parts.join("  ")}`);
      if (open) walk(node.children ?? [], `${prefix}${end ? "   " : painter.dim(pipe)}`, depth + 1);
    }
  };
  walk(nodes, "", 0);
  return lines;
}
