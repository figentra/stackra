/**
 * Stackra file contract:
 * Purpose: `SearchReindexOptions<M>`, how `SearchIndex.reindex` runs: the primary key to resume after, an `updatedAt`
 *          floor for a partial reindex, the readied version to write into, and a callback after each batch with its rows and the new cursor.
 * Boundary: a type only. The callback runs after the batch's documents are stored, so a cursor it records never skips a
 *           row; the reindex job records it in `search.indexes` and embeds the rows for a semantic reindex.
 * Runtime: isomorphic
 * Governing contract: ADR 0404 (decision 3: the reindex plan); ADR 0221 (decision 7); stackra-303 (versions).
 */

/** How one reindex runs. */
export interface SearchReindexOptions<M extends object> {
  /** Resume after this primary key (the cursor a stopped rebuild recorded). */
  readonly after?: string;

  /** Index only rows whose `updatedAt` is at or after this instant (a partial reindex). */
  readonly since?: Date;

  /** The readied index version to write into (ADR 0221 d7), a whole number from 2; the live index when absent. */
  readonly version?: number;

  /** Called after each stored batch with its rows and the primary key of its last row. */
  readonly onBatch?: (rows: readonly M[], cursor: string) => Promise<void>;
}
