/**
 * Stackra file contract:
 * Purpose: `SearchNeighbourRequest`, what `SearchIndex.suggest` asks a driver for did-you-mean: the phrase's words and
 *          how many neighbours of each, under the caller's record visibility and scope.
 * Boundary: a type only. The words are normalised as documents are. Neighbours come only from rows the caller may see,
 *           so a suggestion never names a word of a hidden row.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1: trigram lane); ADR 0333 (amendment: visibility bounds search);
 *                     data-layer gap se13 (stackra-326).
 */
import type { SearchRequest } from "#contracts/types/search-request.type";

/** One neighbour lookup. */
export interface SearchNeighbourRequest extends Pick<SearchRequest, "visible" | "scopePaths"> {
  /** The words to find neighbours of, distinct and normalised. */
  readonly words: readonly string[];

  /** The most neighbours per word. */
  readonly limit: number;
}
