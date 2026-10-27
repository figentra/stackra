/**
 * Stackra file contract:
 * Purpose: `CataloguePage`, one page of `GET /-/stackra/v1/catalogue`: items newest publish first, and the cursor of
 *          the next page or null on the last.
 * Boundary: type only; `CATALOGUE_PAGE_SCHEMA` checks it.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 12).
 */
import type { CatalogueItem } from "#contracts/types/catalogue-item.type";

/** One page of the catalogue. */
export type CataloguePage = {
  /** The items on this page, in catalogue order. */
  readonly items: readonly CatalogueItem[];
  /** The cursor for the next page; null on the last page. */
  readonly next: string | null;
};
