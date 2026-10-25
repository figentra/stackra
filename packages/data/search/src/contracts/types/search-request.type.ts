/**
 * Stackra file contract:
 * Purpose: `SearchRequest`, what `Search` asks a driver: the normalised words of the phrase, the exact filter values,
 *          and the slice of the ranked result.
 * Boundary: a type only. Every word must match (as a word prefix, or as text for a fuzzy engine); every filter must
 *           hold its value among its stored values. `words` is never empty and its words are distinct.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1: hybrid search).
 */
import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";

/** One ranked read. */
export interface SearchRequest {
  /** The phrase's distinct words, normalised as documents are. */
  readonly words: readonly string[];

  /** The filter paths and the value each must hold. */
  readonly filters: Readonly<Record<string, SearchFilterValue>>;

  /** How many ranked ids to skip. */
  readonly offset: number;

  /** How many ranked ids to return at most. */
  readonly limit: number;
}
