/**
 * Stackra file contract:
 * Purpose: `waterfallRowsOf`, a waterfall's bars: the start total, each step floating from the running total by its
 *          change (up or down), and the end total, so the chart bridges one figure to the next.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { WaterfallStep } from "#contracts/types/waterfall-step.type";
import type { WaterfallRow } from "#core/types/waterfall-row.type";

/** A total bar, from zero to its value. */
const total = (key: string, label: string, value: number): WaterfallRow => ({
  key,
  label,
  low: Math.min(0, value),
  high: Math.max(0, value),
  value,
  total: value,
  kind: "total",
});

/**
 * The bars from `start` through `steps` to the end total named `endLabel`.
 * @example waterfallRowsOf({ label: "Q1", value: 10 }, [{ key: "a", label: "A", value: -3 }], "Q2").map((row) => [row.low, row.high]);
 * // [[0, 10], [7, 10], [0, 7]]
 */
export function waterfallRowsOf(
  start: { readonly label: string; readonly value: number },
  steps: readonly WaterfallStep[],
  endLabel: string,
): WaterfallRow[] {
  const rows: WaterfallRow[] = [total("start", start.label, start.value)];
  let running = start.value;
  for (const step of steps) {
    const next = running + step.value;
    rows.push({
      key: step.key,
      label: step.label,
      low: Math.min(running, next),
      high: Math.max(running, next),
      value: step.value,
      total: next,
      kind: step.value >= 0 ? "up" : "down",
    });
    running = next;
  }
  rows.push(total("end", endLabel, running));
  return rows;
}
