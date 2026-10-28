/**
 * Stackra file contract:
 * Purpose: `SearchQueryReportRow`, one row of a query log report: a phrase, its searches, its zero-result searches and
 *          the result clicks it led to.
 * Boundary: a type only, returned by `PostgresSearchQueryLogDriver`'s reports.
 * Runtime: node
 * Governing contract: data-layer gap se12 (stackra-326).
 */

/** One report row. */
export interface SearchQueryReportRow {
  /** The normalised phrase. */
  readonly phrase: string;

  /** How many logged reads used it. */
  readonly searches: number;

  /** How many of those found no row. */
  readonly zero: number;

  /** How many result clicks followed it. */
  readonly clicks: number;
}
