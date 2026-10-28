/**
 * Stackra file contract:
 * Purpose: `tallyQueries(work)`, runs `work` in a new counting frame (inside any frame already running) and resolves to
 *          its output with the frame's `QueryTally`.
 * Boundary: internal to this package's node and testing entries. Counts only statements of the database connected
 *           through this package's drivers (their query log feeds the frame).
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 8 and model-orm 12 (stackra-282, STA-1400).
 */
import { QUERY_TALLY } from "#node/constants/query-tally.constant";
import type { QueryTally } from "#node/types/query-tally.type";

/**
 * Counts the statements `work` runs.
 *
 * @example
 * const { output, tally } = await tallyQueries(() => orders.list(where));
 * tally.queries; // 2
 */
export async function tallyQueries<T>(
  work: () => Promise<T>,
): Promise<{ output: T; tally: QueryTally }> {
  const tally: QueryTally = { queries: 0, shapes: new Map(), parent: QUERY_TALLY.getStore() };
  const output = await QUERY_TALLY.run(tally, work);
  return { output, tally };
}
