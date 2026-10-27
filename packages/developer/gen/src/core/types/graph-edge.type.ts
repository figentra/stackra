/**
 * Stackra file contract:
 * Purpose: `GraphEdge`, one resolved line of the graph between two nodes: a call through a generated client, or an
 *          integration event from its publisher to a consumer (labelled with the wire name).
 * Boundary: a type only. Derived by `systemGraph`; never authored. Package use is not an edge (`GraphNode.usedBy`).
 * Runtime: isomorphic
 * Governing contract: ADR 0452 (decision 2); STA-845.
 */

/** A resolved edge. */
export interface GraphEdge {
  /** The calling or publishing node id. */
  readonly from: string;

  /** The called or consuming node id. */
  readonly to: string;

  /** `call` or `event`. */
  readonly kind: "call" | "event";

  /** The event wire name, for an `event` edge. */
  readonly event?: string;
}
