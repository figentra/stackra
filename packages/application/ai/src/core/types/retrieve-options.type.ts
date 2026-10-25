/**
 * Stackra file contract:
 * Purpose: `RetrieveOptions`, what `retrieve` takes beside the query: the vector index and embedder to ask, how many
 *          passages, and the scope to search in.
 * Boundary: a type only. `index` and `embedder` are the `@stackra/search` ports, injected by the facts class that
 *           calls `retrieve`; `scope` is the caller's own (from the principal or the record), never request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 3); ADR 0327 (decision 9: isolation by scope); owner decision 23.
 */
import type { ScopeRef } from "@stackra/contracts";
import type { Embedder, VectorIndex } from "@stackra/search/contracts";

/** The inputs of one retrieval. */
export interface RetrieveOptions {
  /** The index that holds the embedded passages. */
  readonly index: VectorIndex;

  /** The embedder that made the index's vectors; the query must be embedded by the same one. */
  readonly embedder: Embedder;

  /** The most passages to return, a whole number from 1. */
  readonly topK: number;

  /** The scope node whose passages, and its descendants', are searched. */
  readonly scope: ScopeRef;
}
