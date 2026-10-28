/**
 * Stackra file contract:
 * Purpose: `TablePage<T>`, one page of a table read, in the shape of `Page.of(Item)`: the items, the cursor of the next
 *          page when there is one, whether there is, and the row count when the read asked for one.
 * Boundary: a type only; a list query maps the items to its row type and returns the rest unchanged.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 2 and 12); ADR 0095 (`Page.of`, cursor pagination).
 */
import type { TableCount } from "#core/types/table-count.type";

/** A page of `T`. */
export interface TablePage<T> {
  /** The rows of the page, in order. */
  readonly items: T[];

  /** The cursor of the next page; absent on the last page. */
  readonly nextCursor?: string;

  /** Whether a next page exists. */
  readonly hasMore: boolean;

  /** The rows the filters match, when the read passed `count`. */
  readonly count?: TableCount;
}
