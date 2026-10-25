/**
 * Stackra file contract:
 * Purpose: `VectorItem`, one embedded passage a `VectorIndex` stores: its id, the scope node it belongs to, its
 *          embedding, the text it was embedded from and the metadata a query may filter on.
 * Boundary: a type only. The embedding comes from an `Embedder`, so every item of one index has its dimensions. The
 *           scope is the node the passage belongs to, from the authenticated principal or the source record, never
 *           request input; it is what keeps one scope's passages out of another's results.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (pgvector); ADR 0327 (decisions 3 and 9: isolation by scope); owner decision 23.
 */
import type { ScopeRef } from "@stackra/contracts";

import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";

/** One embedded passage. */
export interface VectorItem {
  /** The passage's id, unique across the index; storing it again replaces it. */
  readonly id: string;

  /** The scope node the passage belongs to. */
  readonly scope: ScopeRef;

  /** The embedding, as an `Embedder` gave it. */
  readonly vector: readonly number[];

  /** The text the embedding was made from, returned with a hit. */
  readonly text: string;

  /** Values a query filters on by equality, returned with a hit (`{ source: "doc_…", locale: "en" }`). */
  readonly metadata: Readonly<Record<string, SearchFilterValue>>;
}
