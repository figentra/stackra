/**
 * Stackra file contract:
 * Purpose: `ChecklistSummary`, the counts of a drawn checklist, which its summary line shows.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-009.
 */

/** How a checklist went. */
export interface ChecklistSummary {
  /** Rows that are ok. */
  readonly passed: number;

  /** Rows that warn. */
  readonly warnings: number;

  /** Rows that fail. */
  readonly failed: number;

  /** Rows that were skipped or are only information. */
  readonly other: number;
}
