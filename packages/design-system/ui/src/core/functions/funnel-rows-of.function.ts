/**
 * Stackra file contract:
 * Purpose: `funnelRowsOf`, a funnel's steps with each one's width (its share of the first step) and its conversion
 *          from the step before.
 * Boundary: pure; shares are fractions from 0 to 1, the first step's conversion is null.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same numbers on web and native); STA-1371.
 */
import type { FunnelRow } from "#core/types/funnel-row.type";
import type { FunnelStage } from "#contracts/types/funnel-stage.type";

/** The rows of a funnel. */
export function funnelRowsOf(stages: readonly FunnelStage[]): FunnelRow[] {
  const first = Math.max(0, stages[0]?.value ?? 0);
  return stages.map((stage, index) => {
    const previous = stages[index - 1]?.value ?? 0;
    return {
      stage,
      share: first > 0 ? Math.min(1, Math.max(0, stage.value / first)) : 0,
      conversion: index === 0 || previous <= 0 ? null : stage.value / previous,
    };
  });
}
