/**
 * Stackra file contract:
 * Purpose: `CollectionPage`, what a server-mode collection takes back for a query: the rows, the total, the next cursor and the totals.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** One page of rows from the server. */
export interface CollectionPage<TItem extends CollectionItem = CollectionItem> {
  /** The rows of the page, already searched, filtered and sorted. */
  readonly items: readonly TItem[];
  /** How many rows match the query in all. */
  readonly totalCount: number;
  /** The cursor of the next page, or `null` at the end (`cursor` and `infinite` paging). */
  readonly nextCursor?: string | null | undefined;
  /** The footer aggregates over every matching row, by column id; left out, they are computed on the page. */
  readonly aggregates?: Readonly<Record<string, number | null>> | undefined;
}
