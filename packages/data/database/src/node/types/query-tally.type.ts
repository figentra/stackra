/**
 * Stackra file contract:
 * Purpose: `QueryTally`, the statements counted while one piece of work runs (a call's `handle`, a `strictLoading`
 *          block): how many ran, how often each statement shape ran, and the tally around it.
 * Boundary: internal to this package; a mutable counter the ORM's query log increments, this tally and every one
 *           around it, so nested work counts toward both.
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 8 and model-orm 12 (stackra-282, STA-1400).
 */

/** One counting frame. */
export interface QueryTally {
  /** The statements counted so far (transaction control is not counted). */
  queries: number;

  /** How many times each normalised statement shape ran. */
  readonly shapes: Map<string, number>;

  /** The tally of the work around this one, if any. */
  readonly parent: QueryTally | undefined;
}
