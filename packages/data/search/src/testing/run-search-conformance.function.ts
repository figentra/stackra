/**
 * Stackra file contract:
 * Purpose: `runSearchConformance(makeDriver, options?)`, the `SearchDriver` conformance suite: runs every case of
 *          `SEARCH_CONFORMANCE_CASES` on a fresh driver over its own table seeded with `SEARCH_CONFORMANCE_DOCUMENTS`,
 *          and returns each case's missed rules.
 * Boundary: a test helper in the `./testing` entry, free of any test framework, so a driver package (free or Pro)
 *           asserts `mismatches` empty with its own runner. The caller builds each driver over its transport: the
 *           memory driver as is, an HTTP engine over recorded fixtures or a disposable engine. An error thrown while
 *           seeding, or by a case outside a refusal check, is a miss of that case, never a crash of the run.
 * Runtime: isomorphic
 * Governing contract: ADR 0089 (decision 5: every driver passes its port's conformance suite); ADR 0266; ADR 0269.
 */
import type { SearchDriver } from "#contracts/index";
import { SEARCH_CONFORMANCE_CASES } from "#testing/search-conformance-cases.constant";
import { SEARCH_CONFORMANCE_DOCUMENTS } from "#testing/search-conformance-documents.constant";
import { searchConformanceTable } from "#testing/search-conformance-table.function";
import type { SearchConformanceOptions } from "#testing/search-conformance-options.type";
import type { SearchConformanceResult } from "#testing/search-conformance-result.type";

/**
 * Runs the suite.
 *
 * @example
 * const results = await runSearchConformance(() => new MemorySearchDriver());
 * expect(results.flatMap((result) => result.mismatches)).toEqual([]);
 */
export async function runSearchConformance(
  makeDriver: () => SearchDriver | Promise<SearchDriver>,
  options: SearchConformanceOptions = {},
): Promise<SearchConformanceResult[]> {
  const results: SearchConformanceResult[] = [];
  for (const conformance of SEARCH_CONFORMANCE_CASES) {
    const table = searchConformanceTable(conformance.id);
    let mismatches: string[];
    try {
      const driver = await makeDriver();
      await driver.index(table, SEARCH_CONFORMANCE_DOCUMENTS);
      mismatches = await conformance.run(driver, table, options);
    } catch (error) {
      mismatches = [`threw: ${error instanceof Error ? error.message : String(error)}`];
    }
    results.push({ caseId: conformance.id, mismatches });
  }
  return results;
}
