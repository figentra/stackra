/**
 * Stackra file contract:
 * Purpose: `SearchRange`, the bounds a range filter puts on a `@Searchable` range field: a price band, a date window.
 * Boundary: a type only. Bounds are numbers for a number field and ISO 8601 strings for a date field, all of one type;
 *           at least one is given. A row passes when one of its values of the path lies within every bound given.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1: hybrid search with filters); data-layer gap se9 (stackra-302).
 */

/** The bounds of one range filter. */
export interface SearchRange {
  /** The value is at least this. */
  readonly gte?: number | string;

  /** The value is above this. */
  readonly gt?: number | string;

  /** The value is at most this. */
  readonly lte?: number | string;

  /** The value is below this. */
  readonly lt?: number | string;
}
