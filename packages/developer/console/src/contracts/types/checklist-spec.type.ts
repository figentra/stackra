/**
 * Stackra file contract:
 * Purpose: `ChecklistSpec`, a checklist as data: its rows, the order of their groups and an optional title.
 * Boundary: a type only. A failed row ends the run with exit code 1 unless the handler returns another code.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-009.
 */
import type { CheckRow } from "#contracts/types/check-row.type";

/** A checklist to draw. */
export interface ChecklistSpec {
  /** The rows. */
  readonly rows: readonly CheckRow[];

  /** The group headings in order; groups not named here follow in first-seen order. */
  readonly groups?: readonly string[];

  /** A title above the checklist. */
  readonly title?: string;
}
