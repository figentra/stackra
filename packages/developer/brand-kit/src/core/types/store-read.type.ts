/**
 * Stackra file contract:
 * Purpose: `StoreRead`, what `readStore` found: the caption sets, every file it read (for the input hash) and the
 *          problem lines.
 * Boundary: a type of the `.` entry; no runtime value.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D19).
 */
import type { StoreCaptionSet } from "#contracts/types/store-caption-set.type";

/** What `readStore` found. */
export interface StoreRead {
  /** The caption sets it found. */
  readonly sets: StoreCaptionSet[];

  /** Every file it read, by path, for the input hash. */
  readonly read: Map<string, Uint8Array>;

  /** The problem lines found while reading. */
  readonly problems: string[];
}
