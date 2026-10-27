/**
 * Stackra file contract:
 * Purpose: `SearchConformanceCase`, one rule of the `SearchDriver` port as a runnable case of the conformance suite.
 * Boundary: a type only, in the `./testing` entry. A case runs on a fresh driver over its own table that already holds
 *           `SEARCH_CONFORMANCE_DOCUMENTS`, and returns the rules missed instead of throwing.
 * Runtime: isomorphic
 * Governing contract: ADR 0089 (decision 5).
 */
import type { SearchDriver, SearchTable } from "#contracts/index";
import type { SearchConformanceOptions } from "#testing/search-conformance-options.type";

/** One runnable rule. */
export interface SearchConformanceCase {
  /** Stable id, `<area>.<rule>`. */
  readonly id: string;

  /** Runs the rule on `driver` over `table` (already holding the documents) and returns what it missed. */
  readonly run: (
    driver: SearchDriver,
    table: SearchTable,
    options: SearchConformanceOptions,
  ) => Promise<string[]>;
}
