/**
 * Stackra file contract:
 * Purpose: `describeConsumerGateStep(result)`, the detail cell of a step in the markdown summary: the excusing
 *          issues of an `allowed` step, the first three uncovered lines (and expired issues) of a `fail`, the reason
 *          of a `skipped` step.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateStepResult } from "#node/consumer-gate/types/consumer-gate-step-result.type";

/**
 * The detail text of one step result.
 *
 * @param result - the step result.
 * @example
 * describeConsumerGateStep({ id: "test", status: "allowed", issues: ["STA-1"] }); // "STA-1"
 */
export function describeConsumerGateStep(result: ConsumerGateStepResult): string {
  if (result.status === "allowed") return (result.issues ?? []).join(", ");
  if (result.status === "fail") {
    return [
      ...(result.uncovered ?? []).slice(0, 3),
      ...(result.expired?.length ? [`expired: ${result.expired.join(", ")}`] : []),
    ].join("; ");
  }
  return result.reason ?? "";
}
