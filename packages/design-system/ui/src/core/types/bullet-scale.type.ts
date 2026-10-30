/**
 * Stackra file contract:
 * Purpose: `BulletScale`, one bullet chart row placed on its scale in percent (`bulletScaleOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** A row's bands, value and target, in percent of its scale. */
export interface BulletScale {
  readonly bands: readonly { readonly from: number; readonly to: number }[];
  readonly value: number;
  /** Null when the row has no target. */
  readonly target: number | null;
}
