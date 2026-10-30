/**
 * Stackra file contract:
 * Purpose: `CalendarDay`, one cell of a calendar heatmap: its ISO date, its value, and whether it falls in the range.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One day of a calendar heatmap. */
export interface CalendarDay {
  /** `YYYY-MM-DD`, in UTC. */
  readonly date: string;
  /** The day's value; null for a day with none. */
  readonly value: number | null;
  /** False for the padding days that fill the first and last weeks. */
  readonly isInRange: boolean;
}
