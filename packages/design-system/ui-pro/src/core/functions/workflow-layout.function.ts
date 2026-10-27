/**
 * Stackra file contract:
 * Purpose: `workflowLayout(nodes, edges)`, where each node of a `WorkflowCanvas` sits: its column (`layer`, the
 *          longest path from a node with no arrow in) and its row in that column, plus the grid's size.
 * Boundary: internal; pure. Edges naming an unknown node and self-loops are ignored. A node on a cycle (which an
 *           automation document cannot hold, its references point backwards) goes one column after the furthest
 *           node already placed that points at it, so the layout always ends. Rows keep the nodes' given order.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3: pure math in core/functions); OS-230 (graph canvas).
 */
import type { WorkflowEdge } from "#contracts/types/workflow-edge.type";
import type { WorkflowNode } from "#contracts/types/workflow-node.type";
import type { WorkflowLayout } from "#core/types/workflow-layout.type";

/**
 * Lays a workflow graph out in columns, left to right in flow order.
 *
 * @example
 * workflowLayout([{ id: "a", title: "A" }, { id: "b", title: "B" }], [{ from: "a", to: "b" }]).placements.get("b");
 * // { layer: 1, row: 0 }
 */
export function workflowLayout(
  nodes: readonly WorkflowNode[],
  edges: readonly WorkflowEdge[],
): WorkflowLayout {
  const ids = new Set(nodes.map((node) => node.id));
  const kept = edges.filter(
    (edge) => edge.from !== edge.to && ids.has(edge.from) && ids.has(edge.to),
  );
  const incoming = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  for (const edge of kept) incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);

  const layer = new Map<string, number>();
  const settle = (id: string): void => {
    let deepest = -1;
    for (const edge of kept)
      if (edge.to === id && layer.has(edge.from))
        deepest = Math.max(deepest, layer.get(edge.from) ?? 0);
    layer.set(id, deepest + 1);
  };

  // Kahn's order, in the nodes' given order, so a node is placed after everything that points at it.
  const queue = nodes.filter((node) => incoming.get(node.id) === 0).map((node) => node.id);
  while (queue.length > 0 || layer.size < ids.size) {
    const id = queue.shift() ?? nodes.find((node) => !layer.has(node.id))?.id;
    if (id === undefined || layer.has(id)) continue;
    settle(id);
    for (const edge of kept) {
      if (edge.from !== id) continue;
      const left = (incoming.get(edge.to) ?? 0) - 1;
      incoming.set(edge.to, left);
      if (left === 0 && !layer.has(edge.to)) queue.push(edge.to);
    }
  }

  const filled: number[] = [];
  const placements = new Map<string, { readonly layer: number; readonly row: number }>();
  for (const node of nodes) {
    const at = layer.get(node.id) ?? 0;
    const row = filled[at] ?? 0;
    filled[at] = row + 1;
    placements.set(node.id, { layer: at, row });
  }
  return {
    placements,
    layers: filled.length,
    rows: Math.max(0, ...filled),
  };
}
