/**
 * Stackra file contract:
 * Purpose: `BackfillSession`, the database `runBackfill` drives: one statement outside a transaction, or a run of them
 *          inside one.
 * Boundary: a type only. The node `backfill` opens one over the direct URL with the migration runner's timeouts; a test
 *           wraps a PGlite. Statements are SQL text without parameters.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs); ADR 0473 (decision 3: the direct URL).
 */
import type { BackfillQuery } from "#core/types/backfill-query.type";

/** A database session a backfill runs on. */
export interface BackfillSession {
  /** Runs one statement on its own. */
  readonly query: BackfillQuery;

  /** Runs `run` in one transaction, committed when it resolves and rolled back when it throws. */
  readonly transaction: <T>(run: (query: BackfillQuery) => Promise<T>) => Promise<T>;
}
