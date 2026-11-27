/**
 * Stackra file contract:
 * Purpose: `summariseLatencies(durations, failures)`, the `LatencySummary` of one scenario's run times.
 * Boundary: pure; copies and sorts `durations`, rounds each figure to a microsecond.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import type { LatencySummary } from "#node/latency/latency-summary.type";
import { percentile } from "#node/latency/percentile.function";

/** Rounds `ms` to three decimals, a microsecond. */
const round = (ms: number): number => Math.round(ms * 1000) / 1000;

/**
 * The summary of `durations` (each in milliseconds) and the failed runs.
 *
 * @param durations - the run time of each run that resolved.
 * @param failures - how many runs threw, and the first one's message.
 * @example
 * summariseLatencies([3, 1, 2], { count: 0 }).p50; // 2
 */
export function summariseLatencies(
  durations: readonly number[],
  failures: { readonly count: number; readonly first?: string | undefined },
): LatencySummary {
  const sorted = durations.toSorted((a, b) => a - b);
  return {
    served: sorted.length,
    failed: failures.count,
    ...(failures.first === undefined ? {} : { firstError: failures.first }),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
    max: round(sorted.at(-1) ?? 0),
  };
}
