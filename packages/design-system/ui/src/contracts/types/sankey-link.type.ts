/**
 * Stackra file contract:
 * Purpose: `SankeyLink`, one flow of a sankey chart: how much passes from one node to the next.
 * Boundary: types only. Links must not form a cycle.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One flow between two nodes. */
export interface SankeyLink {
  /** The key of the node it leaves. */
  readonly source: string;
  /** The key of the node it reaches. */
  readonly target: string;
  /** How much flows; zero and negative values are left out. */
  readonly value: number;
}
