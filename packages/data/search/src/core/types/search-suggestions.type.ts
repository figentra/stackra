/**
 * Stackra file contract:
 * Purpose: `SearchSuggestions`, what `search.in(Model).suggest(prefix)` returns: popular phrases that complete the
 *          prefix, and a corrected phrase when the prefix finds nothing (did-you-mean).
 * Boundary: a type only. Completions come from the query log of the session's scope (none without a log); the
 *           correction from the indexed words of rows the caller may see.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 4 and 6: the palette and the search API); data-layer gap se13 (stackra-326).
 */

/** The suggestions for one prefix. */
export interface SearchSuggestions {
  /** Logged phrases that start with the prefix and found rows, most frequent first. */
  readonly completions: readonly string[];

  /** The phrase with each unknown word swapped for its closest indexed word; absent when the prefix finds rows. */
  readonly didYouMean?: string;
}
