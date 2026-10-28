/**
 * Stackra file contract:
 * Purpose: `SearchVector`, the query embedding a hybrid or semantic read hands a driver that fuses vectors
 *          (`SearchDriver.fusesVectors`): the phrase's vector and the metadata that picks this index's passages out of
 *          the shared vector index.
 * Boundary: a type only. The vector comes from the `Embedder` the index's passages were made with, so it has their
 *           dimension. Each passage of a row carries the row's primary key as metadata `row`, which is how a driver
 *           joins a passage back to its row; `passages` is matched by metadata equality, as `VectorQueryOptions.filter`.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1: the pgvector lane of the hybrid ranking); ADR 0160 (pgvector).
 */
import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";

/** The vector lane of one read. */
export interface SearchVector {
  /** The phrase's embedding. */
  readonly values: readonly number[];

  /** The metadata every passage of this index holds (`{ source: "search", model: "Product" }`). */
  readonly passages: Readonly<Record<string, SearchFilterValue>>;
}
