/**
 * Stackra file contract:
 * Purpose: `SearchFacetRequest`, what `SearchIndex.facets` asks a driver: the filter paths to count values of, over the
 *          rows a search with the same words, filters and record visibility would match.
 * Boundary: a type only. `words` may be empty (browsing with no phrase): then every indexed row that holds the filters
 *           counts. The visibility subquery is the same one a ranked read carries (ADR 0333), applied before counting,
 *           so a count never includes a row the caller may not see; an engine that cannot apply it refuses.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (amendment: visibility bounds search, facets included); ADR 0404 (facets under the
 *                     VisibilityFilter).
 */
import type { SearchRequest } from "#contracts/types/search-request.type";

/** One facet count. */
export interface SearchFacetRequest extends Omit<SearchRequest, "offset" | "limit"> {
  /** The filter paths whose values are counted. */
  readonly paths: readonly string[];

  /** The most values returned per path, the most frequent first. */
  readonly limit: number;
}
