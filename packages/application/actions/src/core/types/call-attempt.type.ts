/**
 * Stackra file contract:
 * Purpose: `CallAttempt`, which attempt of a queued job a call is: its number from 1 and whether it is the last one
 *          the job's plan allows, so a job that may give up (a quota it cannot read) acts on the last attempt instead of
 *          throwing again.
 * Boundary: a type only. Only the queue worker sets it (`CallOptions.attempt`); a direct call has none.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1); ADR 0305 (rule 28: the job surface).
 */

/** One attempt of a queued job. */
export interface CallAttempt {
  /** The attempt's number, 1 for the first. */
  readonly number: number;

  /** Whether no attempt follows this one: a retryable failure here dead-letters the job. */
  readonly last: boolean;
}
