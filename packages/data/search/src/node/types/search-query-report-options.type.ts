/**
 * Stackra file contract:
 * Purpose: `SearchQueryReportOptions`, the window and size of a query log report.
 * Boundary: a type only, taken by `PostgresSearchQueryLogDriver`'s reports, which check the bounds.
 * Runtime: node
 * Governing contract: data-layer gap se12 (stackra-326).
 */

/** The window and size of a report. */
export interface SearchQueryReportOptions {
  /** The model's class name; every model when absent. */
  readonly model?: string;

  /** The last how many days, 1 to 366; 30 when absent. */
  readonly days?: number;

  /** How many phrases at most, 1 to 100; 20 when absent. */
  readonly limit?: number;
}
