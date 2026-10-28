/**
 * Stackra file contract:
 * Purpose: `SearchSuggestOptions`, what `search.in(Model).suggest(prefix, options)` takes: how many completions.
 * Boundary: a type only. `undefined` members are allowed, so a query passes its input's optional fields through.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 6); data-layer gap se13 (stackra-326).
 */

/** The options of a suggestion read. */
export interface SearchSuggestOptions {
  /** How many completions at most, 1 to 100; 20 when absent. */
  readonly limit?: number | undefined;
}
