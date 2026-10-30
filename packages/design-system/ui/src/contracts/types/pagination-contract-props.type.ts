/**
 * Stackra file contract:
 * Purpose: `PaginationContractProps`, the props every runtime's `Pagination` takes: numbered pages over a known total,
 *          with previous and next, an optional page-size choice and an optional jump to a page.
 * Boundary: types only; pages count from 1 and every number is written in the customer's digits. For an unknown total
 *           (a cursor), use CursorPagination.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */

/** Props shared by the web and native `Pagination`. */
export interface PaginationContractProps {
  /** How many records there are in all. */
  readonly total: number;
  /** The current page, for a controlled pagination; pair it with `onPageChange`. */
  readonly page?: number | undefined;
  /** The starting page, for an uncontrolled pagination; defaults to 1. */
  readonly defaultPage?: number | undefined;
  /** Called with the page someone moves to. */
  readonly onPageChange?: ((page: number) => void) | undefined;
  /** Records per page, for a controlled size; pair it with `onPageSizeChange`. */
  readonly pageSize?: number | undefined;
  /** The starting records per page; defaults to the first of `pageSizes`, or 10. */
  readonly defaultPageSize?: number | undefined;
  /** Called with the new size; the page goes back to 1. */
  readonly onPageSizeChange?: ((pageSize: number) => void) | undefined;
  /** The sizes to choose from; left out, there is no size choice. */
  readonly pageSizes?: readonly number[] | undefined;
  /** True to add a "Go to page" input. */
  readonly hasJump?: boolean | undefined;
  /** False to hide the "1–10 of 240" summary. Defaults to true. */
  readonly hasSummary?: boolean | undefined;
  /** Pages shown either side of the current one; defaults to 1. */
  readonly siblings?: number | undefined;
  /** The landmark's name, for example "Invoices pages"; defaults to the catalogue's "Pagination". */
  readonly label?: string | undefined;
}
