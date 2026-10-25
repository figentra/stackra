/**
 * Stackra file contract:
 * Purpose: `SearchRequest`, what `Search` asks a driver: the normalised words of the phrase, the exact filter values,
 *          and the slice of the ranked result.
 * Boundary: a type only. Every word must match (as a word prefix, or as text for a fuzzy engine), itself or one of its
 *           alternatives; every filter must hold its value among its stored values; only visible rows are ranked.
 *           `words` is never empty and its words are distinct.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 and 3: hybrid search, Arabic); ADR 0333 (amendment: visibility bounds
 *                     search); OS-173 (Arabizi).
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

  /**
   * Other spellings of a word, any of which may match in its place (the Arabic spelling of an Arabizi word); a word
   * with no entry matches only as itself.
   */
  readonly alternatives?: Readonly<Record<string, readonly string[]>>;

  /**
   * The parameterised SQL subquery of the primary keys the caller may see (record visibility, ADR 0333), which a SQL
   * engine applies inside every lane before it ranks; absent when every row in the session is visible. An engine that
   * cannot apply it refuses the request rather than rank rows the caller may not see.
   */
  readonly visible?: { readonly sql: string; readonly params: readonly unknown[] };
}
