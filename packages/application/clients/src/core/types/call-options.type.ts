/**
 * Stackra file contract:
 * Purpose: `CallOptions`, the caller's options of one call: the Idempotency-Key (a workflow step key), the principal a
 *          service acts for, and the abort signal.
 * Boundary: a type only; carried into the `ClientRequest` a transport receives.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (idempotency step); ADR 0260 (decision 4).
 */

/** Options of one call. */
export interface CallOptions {
  /** The same key on every attempt, so a retry is the same call (`ctx.stepKey`). */
  readonly idempotencyKey?: string;

  /** The principal a service acts for; the producer's pipeline checks it. */
  readonly onBehalfOf?: string;

  /** Aborts the call when the caller goes away. */
  readonly signal?: AbortSignal;
}
