/**
 * Stackra file contract:
 * Purpose: `GraphNode`, one member in a repo or system graph: its `MemberGraph`, stamped with the repo it sits in, its
 *          id (`<repo>.<member>`) and folder, and the derived fields the graph step fills: the nodes that use it and the
 *          flows it takes part in (its flow tags).
 * Boundary: a type only. `usedBy` and `flows` are always derived again by `systemGraph`; an input value is ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0452 (decisions 1 to 3); STA-845.
 */
import type { MemberGraph } from "#core/types/member-graph.type";

/** A member in the graph. */
export interface GraphNode extends MemberGraph {
  /** `<repo>.<member>` (`os.billing`). */
  readonly id: string;

  /** The repo key, the graph's layer (`stackra`, `os`, `commerce`, `mezzora`). */
  readonly repo: string;

  /** The member folder relative to the repo root (`services/billing`). */
  readonly path: string;

  /** The ids of the nodes that call it or build on its package, sorted. Derived. */
  readonly usedBy: readonly string[];

  /** The ids of the flows a step of which names it, sorted: its flow tags. Derived. */
  readonly flows: readonly string[];
}
