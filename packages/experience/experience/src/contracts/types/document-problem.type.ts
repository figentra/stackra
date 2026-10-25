/**
 * Stackra file contract:
 * Purpose: `DocumentProblem`, one thing the server-side validator found wrong with a document: where, a snake_case code,
 *          the block concerned and, for refused props, the schema's issue paths.
 * Boundary: a type only, in the leaf entry, so the experience service, the builder and a publish step read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 4: the validator); ADR 0270 (decisions 1 and 6); ADR 0231 (snake_case codes).
 */

/** One problem in a document. */
export interface DocumentProblem {
  /** The node's path (`0.children.2`); `""` for the document itself. */
  readonly path: string;

  /**
   * `invalid_node` (not a node, or a key outside `id`, `block`, `props`, `input`, `children`), `unknown_block`,
   * `kind_not_allowed` (the block does not fit the document's kind), `invalid_props`, `duplicate_id`, `too_deep` or
   * `too_many_blocks`.
   */
  readonly code:
    | "invalid_node"
    | "unknown_block"
    | "kind_not_allowed"
    | "invalid_props"
    | "duplicate_id"
    | "too_deep"
    | "too_many_blocks";

  /** The block key, when the node names one. */
  readonly block?: string;

  /** The refused prop paths, dotted, for `invalid_props`. */
  readonly props?: readonly string[];
}
