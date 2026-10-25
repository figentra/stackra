/**
 * Stackra file contract:
 * Purpose: `ImportRunRecord`, what the `ImportLedger` keeps about one run: its id, state, cursor and when it settled.
 * Boundary: a type only. The cursor is the last row a committed batch consumed; `0` before the first batch.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 7 and 8).
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
}
