/**
 * Stackra file contract:
 * Purpose: `TablePage<T>`, one page of a table read, in the shape of `Page.of(Item)`: the items, the cursor of the next
 *          page when there is one, and whether there is.
 * Boundary: a type only; a list query maps the items to its row type and returns the rest unchanged.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2); ADR 0095 (`Page.of`, cursor pagination).
 */

/** A page of `T`. */
export interface TablePage<T> {
  /** The rows of the page, in order. */
  readonly items: T[];

  /** The cursor of the next page; absent on the last page. */
  readonly nextCursor?: string;

  /** Whether a next page exists. */
  readonly hasMore: boolean;
}
