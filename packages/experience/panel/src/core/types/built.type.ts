/**
 * Stackra file contract:
 * Purpose: `Built<N>`, what every builder step returns: a value that yields the node it recorded.
 * Boundary: a type only. Gen calls `toNode()` once on each value a builder method returns and records the tree in the
 *           manifest; authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 5: builders are pure, run once at gen time).
 */

/** A builder step and the node it records. */
export interface Built<N> {
  /** The node recorded so far, frozen. */
  toNode(): N;
}
