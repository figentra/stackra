/**
 * Stackra file contract:
 * Purpose: `searchConformanceTable(caseId)`, the index one case of the `SearchDriver` conformance suite addresses.
 * Boundary: test code only, in the `./testing` entry. Each case gets its own table (`conformance_<case>`), so an
 *           engine that keeps its index between runs (Meilisearch, OpenSearch) never mixes two cases, and a recorded
 *           HTTP fixture can key on the index name.
 * Runtime: isomorphic
 * Governing contract: ADR 0089 (decision 5).
 */
import type { SearchTable } from "#contracts/index";

/**
 * The index of one case.
 *
 * @example
 * searchConformanceTable("search.filters"); // { table: "conformance_search_filters", primaryKey: "id" }
 */
export function searchConformanceTable(caseId: string): SearchTable {
  return { table: `conformance_${caseId.replaceAll(/[^a-z0-9]+/g, "_")}`, primaryKey: "id" };
}
