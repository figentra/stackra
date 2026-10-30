/**
 * Stackra file contract:
 * Purpose: `TimelineRow`, one lane of a timeline chart: a team, a person or a work stream.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One lane of a timeline. */
export interface TimelineRow {
  readonly key: string;
  readonly label: string;
}
