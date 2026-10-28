/**
 * Stackra file contract:
 * Purpose: `strictLoading(work, options?)`, the N+1 guard for a test: runs `work`, counting the statements it runs on
 *          the connected database, and fails when it ran more than `budget` statements or one statement shape more
 *          than `repeats` times (by default any repeat, the signature of a lazy load per row); resolves to the output
 *          and the count otherwise.
 * Boundary: test only. Counts what this package's drivers log (`MemoryDatabaseDriver`, `usePostgres`), outside
 *           transaction control. Nested blocks each check their own statements.
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 8 and model-orm 12 (stackra-282, STA-1400); ADR 0269 (testing
 *                     helpers).
 */
import { queryOverrun } from "#node/functions/query-overrun.function";
import { tallyQueries } from "#node/functions/tally-queries.function";
import type { StrictLoadingOptions } from "#testing/types/strict-loading-options.type";

/**
 * Runs `work` under the N+1 guard.
 *
 * @throws RangeError when `work` ran more than `budget` statements or repeated one shape more than `repeats` times.
 * @example
 * const { output, queries } = await strictLoading(() => graph.through(OrderLine, "variant", options), { budget: 2 });
 */
export async function strictLoading<T>(
  work: () => Promise<T>,
  options: StrictLoadingOptions = {},
): Promise<{ output: T; queries: number }> {
  const { output, tally } = await tallyQueries(work);
  const overrun = queryOverrun(tally, options.budget, options.repeats ?? 1);
  if (overrun !== undefined) throw new RangeError(`strictLoading: ${overrun.message}`);
  return { output, queries: tally.queries };
}
