/**
 * Stackra file contract:
 * Purpose: `ResealOptions`, one step of `EncryptedFieldsResealService.reseal`: where to resume and how many rows to
 *          read.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 7 to 9: a resumable run keeps its cursor); gap gov7 (stackra-312).
 */

/** Options of one re-seal step. */
export interface ResealOptions {
  /** The cursor the previous step returned; absent for the first step. */
  readonly after?: string | number | undefined;

  /** Rows read in this step; 500 when absent. */
  readonly limit?: number | undefined;
}
