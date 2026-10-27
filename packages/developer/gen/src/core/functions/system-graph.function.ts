/**
 * Stackra file contract:
 * Purpose: `systemGraph`, the one step that turns graph parts into a `SystemGraph`: a repo's nodes and flow file make
 *          its `stackra.graph.json`, and the os, commerce and product repo graphs make the merged system graph the
 *          same way. It resolves each call (a service key) to a node, the same repo first, and each consumed event to
 *          every node publishing that wire name; it derives each node's `usedBy` (callers and package users) and its
 *          flow tags (`flows`, the flows a step of which names it); and it lists the gaps in words.
 * Boundary: pure. Nothing is refused: a call or event nothing answers, a flow step naming no node (other than
 *           `actor.*` and `provider.*`), an ambiguous call and a duplicate node or flow id (the first wins) are gaps,
 *           because one repo's graph is expected to point at others. Output is sorted, so it is deterministic.
 * Runtime: isomorphic
 * Governing contract: ADR 0452 (decisions 2 and 3); STA-845.
 */
import { GRAPH_NOTICE } from "#core/constants/graph-notice.constant";
import type { GraphEdge } from "#core/types/graph-edge.type";
import type { GraphFlow } from "#core/types/graph-flow.type";
import type { GraphNode } from "#core/types/graph-node.type";
import type { SystemGraph } from "#core/types/system-graph.type";

/** String order, for `sort`. */
function byText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Whether `ref` names something that is never a gen node. */
function external(ref: string): boolean {
  return ref.startsWith("actor.") || ref.startsWith("provider.");
}

/**
 * The graph of `parts`.
 *
 * @param parts - each repo's nodes and flows, or whole repo graphs to merge.
 * @example
 * systemGraph([osGraph, commerceGraph]).edges; // [{ from: "commerce.sales", to: "os.billing", kind: "call" }, ...]
 */
export function systemGraph(
  parts: readonly { readonly nodes: readonly GraphNode[]; readonly flows: readonly GraphFlow[] }[],
): SystemGraph {
  const gaps = new Set<string>();
  const nodes = new Map<string, GraphNode>();
  for (const node of parts.flatMap((part) => part.nodes))
    if (nodes.has(node.id)) gaps.add(`node ${node.id} is declared twice; the first is kept`);
    else nodes.set(node.id, node);
  const flows = new Map<string, GraphFlow>();
  for (const flow of parts.flatMap((part) => part.flows))
    if (flows.has(flow.id)) gaps.add(`flow ${flow.id} is declared twice; the first is kept`);
    else flows.set(flow.id, flow);

  const edges = new Map<string, GraphEdge>();
  const usedBy = new Map<string, Set<string>>();
  const use = (target: string, user: string): void => {
    if (target !== user) usedBy.set(target, (usedBy.get(target) ?? new Set()).add(user));
  };
  const byPackage = new Map([...nodes.values()].map((node) => [node.package, node.id]));
  for (const node of nodes.values()) {
    for (const service of node.calls) {
      const candidates = [...nodes.values()].filter((other) => other.member === service);
      const local = candidates.filter((other) => other.repo === node.repo);
      const target =
        local.length === 1 ? local[0] : candidates.length === 1 ? candidates[0] : undefined;
      if (target === undefined) {
        gaps.add(
          candidates.length === 0
            ? `${node.id} calls ${service}, which no node in the graph answers`
            : `${node.id} calls ${service}, which ${candidates.map((other) => other.id).join(" and ")} all answer`,
        );
        continue;
      }
      edges.set(`call ${node.id} ${target.id}`, { from: node.id, to: target.id, kind: "call" });
      use(target.id, node.id);
    }
    for (const name of node.packages) {
      const target = byPackage.get(name);
      if (target !== undefined) use(target, node.id);
    }
    for (const wire of node.eventsIn) {
      const publishers = [...nodes.values()].filter((other) => other.eventsOut.includes(wire));
      if (publishers.length === 0) gaps.add(`${node.id} consumes ${wire}, which no node publishes`);
      for (const publisher of publishers)
        edges.set(`event ${publisher.id} ${node.id} ${wire}`, {
          from: publisher.id,
          to: node.id,
          kind: "event",
          event: wire,
        });
    }
  }

  const tags = new Map<string, Set<string>>();
  for (const flow of flows.values())
    for (const step of flow.steps)
      for (const ref of [step.from, step.to]) {
        if (external(ref)) continue;
        if (!nodes.has(ref))
          gaps.add(`flow ${flow.id} names ${ref}, which is no node in the graph`);
        else tags.set(ref, (tags.get(ref) ?? new Set()).add(flow.id));
      }

  return {
    $comment: GRAPH_NOTICE,
    version: 1,
    repos: [...new Set([...nodes.values()].map((node) => node.repo))].sort(byText),
    nodes: [...nodes.values()]
      .sort((left, right) => byText(left.id, right.id))
      .map((node) => ({
        ...node,
        usedBy: [...(usedBy.get(node.id) ?? [])].sort(byText),
        flows: [...(tags.get(node.id) ?? [])].sort(byText),
      })),
    flows: [...flows.values()].sort((left, right) => byText(left.id, right.id)),
    edges: [...edges].sort(([left], [right]) => byText(left, right)).map(([, edge]) => edge),
    gaps: [...gaps].sort(byText),
  };
}
