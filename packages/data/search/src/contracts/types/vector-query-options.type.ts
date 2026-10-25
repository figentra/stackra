/**
 * Stackra file contract:
 * Purpose: `VectorQueryOptions`, what a `VectorIndex` query takes beside its vector: how many hits, the scope node to
 *          search in, and the metadata every hit must carry.
 * Boundary: a type only. The scope narrows to passages at or below its node; row-level security still limits a
 *           Postgres query to the session's granted scopes on top of it.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 3 and 9); owner decision 23.
 */
import type { ScopeRef } from "@stackra/contracts";

import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";

/** How a vector query is bounded. */
export interface VectorQueryOptions {
  /** The most hits to return, a whole number from 1. */
  readonly topK: number;

  /** The scope node whose passages, and its descendants', are searched. */
  readonly scope: ScopeRef;

  /** Metadata values each hit must equal; absent for none. */
  readonly filter?: Readonly<Record<string, SearchFilterValue>>;
}
