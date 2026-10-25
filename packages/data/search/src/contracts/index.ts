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
export { VectorIndex } from "#contracts/ports/vector-index.port";
export type { SearchDocument } from "#contracts/types/search-document.type";
export type { SearchFilterValue } from "#contracts/types/search-filter-value.type";
export type { SearchRequest } from "#contracts/types/search-request.type";
export type { SearchTable } from "#contracts/types/search-table.type";
export type { VectorHit } from "#contracts/types/vector-hit.type";
export type { VectorItem } from "#contracts/types/vector-item.type";
export type { VectorQueryOptions } from "#contracts/types/vector-query-options.type";
