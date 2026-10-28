/**
 * Stackra file contract:
 * Purpose: `SearchSimilarOptions<M>`, what `search.in(Model).similar(phrase, options)` takes: the embedder of the
 *          index's passages, exact filters on the facet's filter fields, how many rows and the relations to load.
 * Boundary: a type only. The embedder must be the one the passages were made with (`search.embedder`), so the vectors
 *           compare; a filter key is a path the model's `@Searchable` lists under `filters`.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1: the vector lane); stackra-301 (`SearchIndex.similar`).
 */
import type { Embedder } from "#contracts/index";
import type { SearchFindOptions } from "#core/types/search-find-options.type";

/** The options of a semantic read. */
export interface SearchSimilarOptions<M extends object> extends Pick<
  SearchFindOptions<M>,
  "filters" | "limit" | "populate"
> {
  /** The embedder the phrase is embedded with. */
  readonly embedder: Embedder;
}
