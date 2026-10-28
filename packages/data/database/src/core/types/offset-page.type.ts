/**
 * Stackra file contract:
 * Purpose: `OffsetPage<T>`, one page of an offset read: its rows, the total of matching rows, and the page numbers a
 *          numbered pager shows.
 * Boundary: a type only; `pages` is `ceil(total / perPage)`, 0 when nothing matches.
 * Runtime: node
 * Governing contract: data-layer gap mo14 (stackra-280).
 */

/** A numbered page of `T`. */
export interface OffsetPage<T> {
  /** The rows of the page, in order. */
  readonly items: T[];

  /** How many rows match in all. */
  readonly total: number;

  /** This page's number, from 1. */
  readonly page: number;

  /** The rows a page holds. */
  readonly perPage: number;

  /** How many pages there are. */
  readonly pages: number;
}
