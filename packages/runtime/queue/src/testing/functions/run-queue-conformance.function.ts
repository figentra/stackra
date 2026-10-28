/**
 * Stackra file contract:
 * Purpose: `runQueueConformance(makeDriver, options?)`, the `QueueDriver` conformance suite: runs every case of
 *          `QUEUE_CONFORMANCE_CASES` (less the ids in `options.skip`) on a fresh driver and returns each case's missed
 *          rules.
 * Boundary: a test helper in the `./testing` entry, free of any test framework, so a driver package asserts
 *           `mismatches` empty with its own runner: the memory driver as is, the Postgres driver over a disposable
 *           database in the integration tier. An error thrown by a case is a miss of that case, never a crash of the run.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1, 2 and 3); ADR 0142 (every driver passes its port's suite); ADR 0269.
 */
import type { QueueDriver } from "#contracts/index";
import { QUEUE_CONFORMANCE_CASES } from "#testing/constants/queue-conformance-cases.constant";
import type { QueueConformanceResult } from "#testing/types/queue-conformance-result.type";

/**
 * Runs the suite.
 *
 * @example
 * const results = await runQueueConformance(() => new MemoryQueueDriver());
 * expect(results.flatMap((result) => result.mismatches)).toEqual([]);
 */
export async function runQueueConformance(
  makeDriver: () => QueueDriver | Promise<QueueDriver>,
  options: { readonly skip?: readonly string[] } = {},
): Promise<QueueConformanceResult[]> {
  const results: QueueConformanceResult[] = [];
  for (const conformance of QUEUE_CONFORMANCE_CASES) {
    if (options.skip?.includes(conformance.id) === true) continue;
    let mismatches: string[];
    try {
      mismatches = await conformance.run(await makeDriver());
    } catch (error) {
      mismatches = [`threw: ${error instanceof Error ? error.message : String(error)}`];
    }
    results.push({ caseId: conformance.id, mismatches });
  }
  return results;
}
