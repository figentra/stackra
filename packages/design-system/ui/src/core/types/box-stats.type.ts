/**
 * Stackra file contract:
 * Purpose: `BoxStats`, the five-number summary of a box plot group (`boxStatsOf`) with Tukey whiskers and outliers.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** A group's summary. */
export interface BoxStats {
  /** The smallest and largest values, outliers included. */
  readonly min: number;
  /** The largest value, outliers included. */
  readonly max: number;
  /** The lower quartile, the median and the upper quartile. */
  readonly q1: number;
  /** The middle value of the group. */
  readonly median: number;
  /** The upper quartile, the top of the box. */
  readonly q3: number;
  /** The whisker ends: the furthest values within 1.5 times the interquartile range of the box. */
  readonly low: number;
  /** The upper whisker end. */
  readonly high: number;
  /** The values beyond the whiskers. */
  readonly outliers: readonly number[];
}
