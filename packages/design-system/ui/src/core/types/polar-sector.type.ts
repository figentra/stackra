/**
 * Stackra file contract:
 * Purpose: `PolarSector`, one slice of a polar area chart as `polarSectorsOf` lays it out: its row and series, its
 *          angles and its radius as a share of the largest value.
 * Boundary: types only; not exported from the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */

/** One slice of a polar area chart. */
export interface PolarSector {
  /** The row's position in the data. */
  readonly row: number;
  /** The series' position. */
  readonly series: number;
  /** The start angle in radians, clockwise from the top. */
  readonly start: number;
  /** The end angle in radians, clockwise from the top. */
  readonly end: number;
  /** The radius as a share of the outer radius: the value over the largest value, 0 for a missing one. */
  readonly share: number;
  /** The value, or undefined when the row has none. */
  readonly value: number | undefined;
}
