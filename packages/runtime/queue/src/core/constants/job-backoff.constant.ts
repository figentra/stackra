/**
 * Stackra file contract:
 * Purpose: `JOB_BACKOFF`, the wait part of a job's `RetryPolicy`: a ten-second base, up to half again of jitter, at
 *          most an hour. The job's `Backoff` code picks the curve; the worker, the outbox relay and workflow steps
 *          pass both to the contracts `backoffDelay`.
 * Boundary: a frozen constant; the values are the ones the queue's own formula had before stackra-223, so no job's
 *           wait changed when the formula moved to @stackra/contracts.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: retries with backoff and jitter); owner D10 2026-10-28 (stackra-223).
 */
import { Duration, Jitter } from "@stackra/contracts";
import type { RetryPolicy } from "@stackra/contracts";

/** The job backoff. */
export const JOB_BACKOFF = Object.freeze({
  base: Duration.seconds(10),
  max: Duration.hours(1),
  jitter: Jitter.Added,
}) satisfies Required<Pick<RetryPolicy, "base" | "max" | "jitter">>;
