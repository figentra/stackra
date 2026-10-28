/**
 * Stackra file contract:
 * Purpose: `SEMANTIC_SOURCE`, the metadata `source` of every passage search stores in the vector index, so a
 *          retrieval can filter search passages in or out and a search read picks only its own.
 * Boundary: a constant; `SemanticChangeService` writes it and `SearchIndex` reads by it, so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (pgvector, one vector store); stackra-301.
 */

/** The `source` of a search passage. */
export const SEMANTIC_SOURCE = "search";
