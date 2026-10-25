/**
 * Stackra file contract:
 * Purpose: `ListOptions`, the rules `@List` records for an array field: item-count bounds and uniqueness.
 * Boundary: a type only. Gen compiles them to `z.array()` checks; the item rules come from the item type.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 26); ADR 0095 as amended.
 */

/** The rules of an array field. */
export interface ListOptions {
  /** The fewest items. */
  readonly min?: number;

  /** The most items. */
  readonly max?: number;

  /** No two items are equal. */
  readonly unique?: boolean;
}
