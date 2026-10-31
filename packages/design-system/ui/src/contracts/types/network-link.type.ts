/**
 * Stackra file contract:
 * Purpose: `NetworkLink`, one link of a network graph between two nodes, with an optional strength.
 * Boundary: types only. A link is drawn without a direction.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One link between two nodes. */
export interface NetworkLink {
  /** The key of one end. */
  readonly source: string;
  /** The key of the other end. */
  readonly target: string;
  /** Its strength, which sets the line's weight; 1 by default. */
  readonly value?: number | undefined;
}
