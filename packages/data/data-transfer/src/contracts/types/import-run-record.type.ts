/**
 * Stackra file contract:
 * Purpose: `ImportRunRecord`, what the `ImportLedger` keeps about one run: its id, state, cursor, when it settled and
 *          when its before-images were purged.
 * Boundary: a type only. The cursor is the last row the newest committed batch consumed; `0` before the first batch.
 *           A purged run can no longer be reverted.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 7 and 8); ADR 0431 (decision 3).
 */
import type { ImportRunState } from "#contracts/enums/import-run-state.enum";

/** One import run in the ledger. */
export interface ImportRunRecord {
  /** The caller's run id (an import job's public id). */
  readonly id: string;

  /** Where the run is. */
  readonly state: ImportRunState;

  /** The last row a committed batch consumed. */
  readonly cursor: number;

  /** When the run last settled (failed, finished or reverted); absent while it runs. */
  readonly settledAt?: Date;

  /** When the ledger dropped its before-images at the end of the undo window; absent until then. */
  readonly purgedAt?: Date;
}
