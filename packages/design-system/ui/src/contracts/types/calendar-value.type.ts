/**
 * Stackra file contract:
 * Purpose: `CalendarValue`, one day's figure for a calendar heatmap.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One day's value. */
export interface CalendarValue {
  /** `YYYY-MM-DD`; values on the same day add up. */
  readonly date: string;
  readonly value: number;
}
