/**
 * Stackra file contract:
 * Purpose: the `VectorIndex` port: stores embedded passages and finds the nearest ones to a query vector, for
 *          retrieval-augmented generation (@stackra/ai's retrieval) and semantic search.
 * Boundary: an abstract class that is its own token. It deals in vectors only: an `Embedder` makes them, so a driver
 *           never calls a model provider. Similarity is cosine. A query sees passages at or below its scope node; the
 *           Postgres driver runs in the caller's transaction and scope session, so row-level security applies too. A
 *           leaf file: it imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (pgvector, no separate vector store); ADR 0327 (decision 9); ADR 0294 (decisions 15
 *                     and 16); owner decision 23.
 */
import { Port } from "@stackra/contracts";

import type { VectorHit } from "#contracts/types/vector-hit.type";
import type { VectorItem } from "#contracts/types/vector-item.type";
import type { VectorQueryOptions } from "#contracts/types/vector-query-options.type";

/**
 * A vector index.
 *
 * @example
 * await index.upsert([{ id: "doc_1#0", scope, vector, text, metadata: { source: "doc_1" } }]);
 * const hits = await index.query(queryVector, { topK: 5, scope });
 */
export abstract class VectorIndex extends Port {
  /**
   * Stores each item, replacing an item with the same id.
   *
   * @throws TypeError when an item's vector is empty or holds a value that is not a finite number.
   */
  abstract upsert(items: readonly VectorItem[]): Promise<void>;

  /**
   * The `topK` items nearest to `vector`, best first, within the scope and matching the filter.
   *
   * @throws TypeError when `vector` is empty or not finite, or `topK` is not a whole number from 1.
   */
  abstract query(
    vector: readonly number[],
    options: VectorQueryOptions,
  ): Promise<readonly VectorHit[]>;

  /** Removes the items of `ids`; an unknown id is ignored. */
  abstract remove(ids: readonly string[]): Promise<void>;
}
