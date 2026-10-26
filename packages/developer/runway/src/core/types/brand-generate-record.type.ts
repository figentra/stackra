/**
 * Stackra file contract:
 * Purpose: `BrandGenerateRecord`, what a `BrandGenerator` answers for one run: the kit id, the output folder and the
 *          files written there.
 * Boundary: type only; the shape of `brand-kit generate --json`.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5).
 */

/** One brand run's record. */
export interface BrandGenerateRecord {
  /** The kit id. */
  readonly kit: string;

  /** The output folder. */
  readonly out: string;

  /** The files written, relative to `out`. */
  readonly files: readonly string[];
}
