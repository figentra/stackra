/**
 * Stackra file contract:
 * Purpose: `SystemGraph`, the shape of a repo's `stackra.graph.json` and of the merged system graph: the repos it
 *          covers, every node, the declared flows, the resolved call and event edges, and the gaps (a call or event
 *          nothing answers, a flow step naming no node, a duplicate id), which the docs renderer reads.
 * Boundary: a type only. Written by `systemGraph`; a repo graph and the merged graph have the same shape, so merging
 *           merged graphs again is the same step.
 * Runtime: isomorphic
 * Governing contract: ADR 0452; STA-845.
 */
import type { GraphEdge } from "#core/types/graph-edge.type";
import type { GraphFlow } from "#core/types/graph-flow.type";
import type { GraphNode } from "#core/types/graph-node.type";

/** A repo or system graph. */
export interface SystemGraph {
  /** The generated-file notice. */
  readonly $comment: string;

  /** The graph format version. */
  readonly version: 1;

  /** The repo keys it covers, sorted. */
  readonly repos: readonly string[];

  /** Every node, sorted by id. */
  readonly nodes: readonly GraphNode[];

  /** Every declared flow, sorted by id. */
  readonly flows: readonly GraphFlow[];

  /** The resolved edges, sorted. */
  readonly edges: readonly GraphEdge[];

  /** What does not resolve, in words, sorted. */
  readonly gaps: readonly string[];
}
