/**
 * Stackra file contract:
 * Purpose: `StepRetry<W>`, a step's `retry` option: attempts in all, the first wait and the backoff curve of the
 *          contracts `RetryPolicy`, and `live`, which reads values that replace them each time the step fails, so a
 *          retry count and its backoff can be settings with the declared values as their defaults (STA-2610).
 * Boundary: a type only. `live` gets the workflow instance, which the container built and which injects its own
 *           `SettingsReader`; unlike `when` and `correlate` it may read I/O, because it runs between attempts, never
 *           inside a step's transaction. A value that is not valid (attempts below 1, a fractional count) is ignored.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 2: retries with backoff); STA-2610.
 */
import type { RetryPolicy } from "@stackra/contracts";

import type { StepRetryValues } from "#core/types/step-retry-values.type";

/** How a step retries. */
export interface StepRetry<W> extends Pick<RetryPolicy, "attempts" | "backoff" | "base"> {
  /** The values read when the step fails (`(workflow) => workflow.retryOf("record")`); absent ones keep the above. */
  readonly live?: (workflow: W) => Promise<StepRetryValues | undefined>;
}
