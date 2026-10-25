/**
 * Stackra file contract:
 * Purpose: `ObservabilityConfigInvalidError`, thrown when the telemetry plan cannot be built from its inputs: the root
 *          runway's `observability` section or its Sentry or Better Stack provider, an app's Sentry project, or a
 *          heartbeat source. Names the source and every invalid path.
 * Boundary: a plain `Error`, not a refusal: a bad runway is an operator's mistake found by `stackra infra preview`
 *           before anything changes. The inputs hold names and ids only, so the issues may quote them.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 3: previews are reviewed), ADR 0296 (enforcement: each failure is named).
 */
import type { RunwayIssue } from "@stackra/runway";

/**
 * A telemetry input that fails its check.
 *
 * @example
 * try {
 *   observabilityPlan(root, members);
 * } catch (error) {
 *   if (error instanceof ObservabilityConfigInvalidError) error.issues; // [{ path: "root.observability.logs.hotDays", … }]
 * }
 */
export class ObservabilityConfigInvalidError extends Error {
  /** Where the input came from. */
  readonly source: string;

  /** Every invalid value, in check order. */
  readonly issues: readonly RunwayIssue[];

  /**
   * @param source - a description of the input.
   * @param issues - the invalid values.
   */
  constructor(source: string, issues: readonly RunwayIssue[]) {
    super(
      `${source} is invalid: ${issues.map((issue) => `${issue.path || "(document)"}: ${issue.message}`).join("; ")}`,
    );
    this.name = "ObservabilityConfigInvalidError";
    this.source = source;
    this.issues = Object.freeze([...issues]);
  }
}
