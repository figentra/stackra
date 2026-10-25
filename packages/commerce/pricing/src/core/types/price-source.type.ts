/**
 * Stackra file contract:
 * Purpose: `PriceSource`, a list a resolved price was read from, with its replica revision.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decision 3: the result names the replica's revision).
 */

/** A list and its revision. */
export interface PriceSource {
  /** The list's id. */
  readonly listId: string;

  /** The revision it was read at. */
  readonly revision: string;
}
