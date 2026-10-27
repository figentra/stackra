/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/search (the `SearchDriver` conformance suite: its runner,
 *          cases, seed documents and result types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Test support only; never imported by production code. It
 *           imports `./contracts` only, so a driver package (Pro included) needs nothing else of this package to run it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0089 (decision 5); the STA-347 stand-in barrel decision.
 */
export { runSearchConformance } from "#testing/run-search-conformance.function";
export { SEARCH_CONFORMANCE_CASES } from "#testing/search-conformance-cases.constant";
export type { SearchConformanceCase } from "#testing/search-conformance-case.type";
export { SEARCH_CONFORMANCE_DOCUMENTS } from "#testing/search-conformance-documents.constant";
export { searchConformanceTable } from "#testing/search-conformance-table.function";
export type { SearchConformanceOptions } from "#testing/search-conformance-options.type";
export type { SearchConformanceResult } from "#testing/search-conformance-result.type";
