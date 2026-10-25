/**
 * Stackra file contract:
 * Purpose: `PassOptions`, the argument of `Pass({ key })`.
 * Boundary: a type only. The module, the template Schema and the owning record type are derived by gen from the
 *           class's folder and its `content` parameter.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); ADR 0294 (decision 20: identities are derived).
 */

/** The options of a pass kind. */
export interface PassOptions {
  /** The pass kind's key within its module, snake_case (`loyalty_card`). */
  readonly key: string;
}
