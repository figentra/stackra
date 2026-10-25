/**
 * Stackra file contract:
 * Purpose: `StepRetry`, the `retry` option of `@Step`: how many attempts a step gets and how long it waits between two.
 * Boundary: a type only. A refusal that is not retryable fails the step at once whatever the budget (a declined card is
 *           declined again); any other error, or a retryable refusal, takes the next attempt after the backoff, unless
 *           the run's timeout would pass first.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 2: retries and backoff per step); ADR 0148 (decision 1: backoff with jitter);
 *                     ADR 0294 (decision 18).
 */
import type { Backoff } from "@stackra/queue";

/** A step's retry policy. */
export interface StepRetry {
  /** Attempts in all, the first included: a whole number from 1. */
  readonly attempts: number;

  /** The wait between two attempts; `Backoff.Exponential` when absent. */
  readonly backoff?: Backoff;
}
