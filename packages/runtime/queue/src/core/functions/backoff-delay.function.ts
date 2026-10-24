/**
 * Stackra file contract:
 * Purpose: `backoffDelay`, the wait in milliseconds before the attempt after a failed one, for a `Backoff` code: a step
 *          of ten seconds (fixed, times the attempt, or doubled per attempt) plus up to half a step of jitter, capped at
 *          an hour.
 * Boundary: pure apart from `random`, which a test passes to pin the jitter. The worker adds the wait to its `now`; a
 *           workflow runtime may reuse it for a step's `retry`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: retries with backoff and jitter).
 */
import { Enum } from "@stackra/contracts";

import { Backoff } from "#core/enums/backoff.enum";

/** The step every code starts from. */
const BASE_MILLISECONDS = 10_000;

/** The longest wait. */
const CAP_MILLISECONDS = 3_600_000;

/**
 * The wait after failed attempt number `attempt` (the first attempt is 1).
 *
 * @param random - a number in `[0, 1)` that picks the jitter; `Math.random` when absent.
 * @throws RangeError when `attempt` is not a whole number from 1, or `backoff` is not a `Backoff` code.
 * @example
 * backoffDelay(Backoff.Exponential, 3, () => 0); // 40000
 * backoffDelay(Backoff.Fixed, 3, () => 0.5); // 12500
 */
export function backoffDelay(
  backoff: Backoff,
  attempt: number,
  random: () => number = Math.random,
): number {
  if (!Number.isInteger(attempt) || attempt < 1)
    throw new RangeError(`An attempt is a whole number from 1, got ${attempt}`);
  if (!Enum.values(Backoff).includes(backoff))
    throw new RangeError(`backoff takes a Backoff code, got ${JSON.stringify(backoff)}`);
  const step =
    backoff === Backoff.Fixed
      ? BASE_MILLISECONDS
      : backoff === Backoff.Linear
        ? BASE_MILLISECONDS * attempt
        : BASE_MILLISECONDS * 2 ** Math.min(attempt - 1, 20);
  return Math.min(CAP_MILLISECONDS, Math.round(step + (random() * step) / 2));
}
