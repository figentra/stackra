/**
 * Stackra file contract:
 * Purpose: `Intent`, one action's natural-language intent as the router reads it: the action key and its phrases in the
 *          viewer's language.
 * Boundary: a type only; gen writes the rows from each action's `intent` option and its lang-file phrases.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 4: intent metadata and the intent router, as amended by ADR 0305 rule 28).
 */

/** One action's intent as the router reads it: the action key and its phrases. */
export interface Intent {
  /** The action or query key it runs (`orders.order.cancel@1`). */
  readonly key: string;

  /** The phrases that name it, in one language. */
  readonly phrases: readonly string[];
}
