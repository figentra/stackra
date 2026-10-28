/**
 * Stackra file contract:
 * Purpose: `queryOverrun(tally, budget, repeats)`, what a counted piece of work went over: its statement count above
 *          `budget`, and each statement shape run more than `repeats` times (an N+1 loop); `undefined` when neither.
 * Boundary: internal to this package's node and testing entries; pure over the tally. The message names counts and
 *           shapes only, never a value.
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 8 and model-orm 12 (stackra-282, STA-1400).
 */
import type { QueryTally } from "#node/types/query-tally.type";

/**
 * The overrun of `tally`, if any.
 *
 * @example
 * queryOverrun(tally, 5, 10); // { message: "ran 7 statements, budget 5", repeated: [] }
 */
export function queryOverrun(
  tally: QueryTally,
  budget: number | undefined,
  repeats: number,
): { message: string; repeated: readonly (readonly [string, number])[] } | undefined {
  const over = budget !== undefined && tally.queries > budget;
  const repeated = [...tally.shapes].filter(([, times]) => times > repeats);
  if (!over && repeated.length === 0) return undefined;
  const parts = [
    ...(over ? [`ran ${tally.queries} statements, budget ${budget}`] : []),
    ...repeated.map(([shape, times]) => `ran ${times} times (limit ${repeats}): ${shape}`),
  ];
  return { message: parts.join("; "), repeated };
}
