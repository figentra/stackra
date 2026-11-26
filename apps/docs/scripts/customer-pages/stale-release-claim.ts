/**
 * Stackra file contract:
 * Purpose: `StaleReleaseClaim`, one line of a customer page or the release runbook that states a release fact which
 *          goes stale (page, line, reason).
 * Boundary: type only; `staleReleaseClaims` produces it.
 * Runtime: node
 * Governing contract: ADR 0013; STA-2847.
 */

/** One stale claim on a page. */
export interface StaleReleaseClaim {
  /** The page, relative to `src/docs`. */
  readonly page: string;
  /** 1-based line number. */
  readonly line: number;
  /** Why the line is refused. */
  readonly reason: string;
}
