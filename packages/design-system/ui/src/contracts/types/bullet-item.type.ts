/**
 * Stackra file contract:
 * Purpose: `BulletItem`, one row of a bullet chart: a measure, its target and the qualitative bands behind it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** One measure against its target. */
export interface BulletItem {
  readonly key: string;
  /** What is measured: "Revenue", "New customers". */
  readonly label: string;
  /** The measure so far. */
  readonly value: number;
  /** The target the measure is judged against; drawn as a tick. */
  readonly target?: number | undefined;
  /**
   * The upper edges of the qualitative bands, ascending, such as poor, fair and good: `[50, 80, 100]`. The last edge
   * is the scale's end unless the value or target passes it.
   */
  readonly ranges?: readonly number[] | undefined;
}
