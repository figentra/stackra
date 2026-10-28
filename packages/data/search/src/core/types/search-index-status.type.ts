/**
 * Stackra file contract:
 * Purpose: `SearchIndexStatus`, one row of the index registry as `search:status` and an admin read show it: the model,
 *          the scope, the state, the facet hash of the last rebuild, how many documents it holds, the resume cursor of a
 *          rebuild in progress, and when it was last fully rebuilt.
 * Boundary: a type only; `SearchIndexRegistry.list` builds it from `search.indexes`. The scope is absent for a
 *           platform-wide index.
 * Runtime: isomorphic
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0327 and ADR 0323 (a scope is a `ScopeRef`).
 */
import type { ScopeRef } from "@stackra/contracts";

import type { SearchIndexState } from "#core/enums/search-index-state.enum";

/** One model's index in one scope. */
export interface SearchIndexStatus {
  /** The model's class name, as a row change names it. */
  readonly model: string;

  /** The scope the index serves; absent for a platform-wide one. */
  readonly scope?: ScopeRef;

  /** Where the index stands. */
  readonly state: SearchIndexState;

  /** The hash of the `@Searchable` facet the last rebuild indexed with. */
  readonly facetHash: string;

  /** Documents indexed by the last full rebuild (so far, while rebuilding). */
  readonly docCount: number;

  /** The primary key a stopped rebuild resumes after. */
  readonly cursor?: string;

  /** When the last full rebuild finished. */
  readonly rebuiltAt?: Date;
}
