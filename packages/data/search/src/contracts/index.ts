/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/search (the `SearchDriver`, `VectorIndex` and `Embedder`
 *          ports and the types they use)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Embedder } from "#contracts/ports/embedder.port";
export { SearchDriver } from "#contracts/ports/search-driver.port";
export { SearchQueryLog } from "#contracts/ports/search-query-log.port";
export { VectorIndex } from "#contracts/ports/vector-index.port";
export type { SearchBoost } from "#contracts/types/search-boost.type";
export type { SearchDocument } from "#contracts/types/search-document.type";
export type { SearchFacetRequest } from "#contracts/types/search-facet-request.type";
export type { SearchFacets } from "#contracts/types/search-facets.type";
export type { SearchFilterValue } from "#contracts/types/search-filter-value.type";
export type { SearchNeighbourRequest } from "#contracts/types/search-neighbour-request.type";
export type { SearchNeighbours } from "#contracts/types/search-neighbours.type";
export type { SearchQueryEntry } from "#contracts/types/search-query-entry.type";
export type { SearchRange } from "#contracts/types/search-range.type";
export type { SearchRecency } from "#contracts/types/search-recency.type";
export type { SearchRequest } from "#contracts/types/search-request.type";
export type { SearchSort } from "#contracts/types/search-sort.type";
export type { SearchTable } from "#contracts/types/search-table.type";
export type { SearchVector } from "#contracts/types/search-vector.type";
export type { VectorHit } from "#contracts/types/vector-hit.type";
export type { VectorItem } from "#contracts/types/vector-item.type";
export type { VectorQueryOptions } from "#contracts/types/vector-query-options.type";
