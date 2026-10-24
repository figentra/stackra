/**
 * Stackra file contract:
 * Purpose: the props for "select all N across pages": how many records match the query in all, and whether the user has
 *          chosen all of them rather than the rows on screen. DataTable offers the choice when a page is fully
 *          selected and BulkActionBar shows and acts on it, from the same three props.
 * Boundary: types only. The pages are cursor pages, so the total is the server's own count and often unknown: without
 *           `totalCount` the choice is never offered. When `isAllMatchingSelected` is true the selected keys are only
 *           the rows on screen and the app acts on the query, not on the keys.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (cursor pages); ADR 0318.
 */

/** Props shared by DataTable and BulkActionBar for selecting every record that matches the query. */
export interface AllMatchingSelectionContractProps {
  /** How many records match the query across all pages, when the server says. Left out, "select all" is not offered. */
  readonly totalCount?: number | undefined;
  /** True when the user chose every matching record; the bar then reads `totalCount` as the selected count. */
  readonly isAllMatchingSelected?: boolean | undefined;
  /** Called with true when the user chooses all matching records and with false when they go back to the rows shown. */
  readonly onAllMatchingSelectedChange?: ((isAllMatchingSelected: boolean) => void) | undefined;
}
