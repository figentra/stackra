/**
 * Stackra file contract:
 * Purpose: `PageQuery`, an offset page read: which page (from 1), how many rows a page holds, and the sort, the same
 *          `TableSort` keys a cursor table takes.
 * Boundary: a type only. `perPage` runs from 1 to `BULK_LIMITS.maxPerPage`; a deep page costs an offset scan, so a
 *           large table pages by cursor (`table`) instead.
 * Runtime: node
 * Governing contract: data-layer gap mo14 (stackra-280); ADR 0097 (decision 5.1).
 */
import type { TableSort } from "#core/types/table-sort.type";

/** An offset page read. */
export interface PageQuery {
  /** The page to read, from 1. */
  readonly page: number;

  /** How many rows a page holds. */
  readonly perPage: number;

  /** One key, or up to three in order; the primary key always ends the order. Newest first when absent. */
  readonly sort?: TableSort | readonly TableSort[];
}
