/**
 * Stackra file contract:
 * Purpose: `backoffDelay(policy, attempt)`, the one backoff formula: the wait in milliseconds after failed attempt
 *          `attempt` (the first is 1) under a `RetryPolicy`'s `base`, `max`, `backoff`, `multiplier` and `jitter`.
 * Boundary: pure apart from `random`, which a test passes to pin the jitter. The curve is capped at `max` before the
 *           jitter, and `Jitter.Added` is capped again, so no wait passes `max`. The caller fills `base` and `max` from
 *           its own defaults, so their values stay where they were (queue 10 s and 1 h, realtime 1 s and 30 s).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 1: backoff with jitter); ADR 0225 (decision 1: reconnect); owner D10
 *                     2026-10-28 (stackra-223: one backoff formula).
 */
import { Enum } from "#core/bases/enum.base";
import { Duration } from "#core/constants/duration.constant";
import { Backoff } from "#core/enums/backoff.enum";
import { Jitter } from "#core/enums/jitter.enum";
import type { RetryPolicy } from "#core/types/retry-policy.type";

/**
 * The wait after failed attempt `attempt`.
 *
 * @param random - a number in `[0, 1)` that picks the jitter; `Math.random` when absent.
 * @throws RangeError when `attempt` is not a whole number from 1, `backoff` or `jitter` is not one of its codes, or
 *         `multiplier` is below 1.
 * @example
 * backoffDelay({ base: Duration.seconds(10), max: Duration.hours(1) }, 3); // 40000
 * backoffDelay({ base: Duration.seconds(1), max: Duration.seconds(30), jitter: Jitter.Equal }, 1, () => 0); // 500
 */
export function backoffDelay(
  policy: Pick<RetryPolicy, "backoff" | "multiplier" | "jitter"> &
    Required<Pick<RetryPolicy, "base" | "max">>,
  attempt: number,
  random: () => number = Math.random,
): number {
  const { backoff = Backoff.Exponential, multiplier = 2, jitter = Jitter.None } = policy;
  if (!Number.isInteger(attempt) || attempt < 1)
    throw new RangeError(`An attempt is a whole number from 1, got ${attempt}`);
  if (!Enum.values(Backoff).includes(backoff))
    throw new RangeError(`backoff takes a Backoff code, got ${JSON.stringify(backoff)}`);
  if (!Enum.values(Jitter).includes(jitter))
    throw new RangeError(`jitter takes a Jitter code, got ${JSON.stringify(jitter)}`);
  if (!(multiplier >= 1)) throw new RangeError(`multiplier is at least 1, got ${multiplier}`);
  const base = Duration.toMilliseconds(policy.base);
  const max = Duration.toMilliseconds(policy.max);
  // A zero base stays zero: `0 * 2 ** 2000` would be `NaN`.
  const step =
    base === 0 || backoff === Backoff.Fixed
      ? base
      : backoff === Backoff.Linear
        ? base * attempt
        : base * multiplier ** (attempt - 1);
  const wait = Math.min(max, step);
  if (jitter === Jitter.Equal) return Math.round(wait / 2 + (random() * wait) / 2);
  if (jitter === Jitter.Added) return Math.round(Math.min(max, wait + (random() * wait) / 2));
  return Math.round(wait);
}
