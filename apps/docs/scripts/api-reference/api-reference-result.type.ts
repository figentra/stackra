/**
 * Stackra file contract:
 * Purpose: `ApiReferenceResult`, what one run of `writeApiReference` did.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: STA-2857.
 */

/** What one run did. */
export interface ApiReferenceResult {
  /** The pages written (write mode), or the drift lines (check mode). */
  readonly lines: readonly string[];
  /** False only in check mode when a page drifted. */
  readonly ok: boolean;
}
