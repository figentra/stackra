/**
 * Stackra file contract:
 * Purpose: `ResealStep`, what one step of `EncryptedFieldsResealService.reseal` did and where the next one resumes,
 *          so a job runner stores the cursor (the import-ledger pattern) and a stopped run continues where it was.
 * Boundary: a type only; counts and a primary key, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 7 to 9); gap gov7 (stackra-312).
 */

/** The outcome of one re-seal step. */
export interface ResealStep {
  /** The rows this step read. */
  readonly scanned: number;

  /** Rows written again under the current key. */
  readonly resealed: number;

  /** Rows left as they were although off the current key: their subject was erased, or a write changed them first. */
  readonly skipped: number;

  /** The primary key to pass as `after` next; null once the table is done. */
  readonly cursor: string | number | null;
}
