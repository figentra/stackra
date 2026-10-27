/**
 * Stackra file contract:
 * Purpose: `canaryVerdict(since, sample, now, settings)`, the decision on one canary: `rollback` once it has served
 *          enough requests and its error rate is over the threshold; `promote` only once the window has passed and
 *          it has served enough requests with the error rate at or under the threshold; `hold` otherwise.
 * Boundary: pure. A timer alone never promotes (too few requests holds, however long the canary ran); a rollback
 *           needs the same minimum, so a handful of early errors does not end a canary.
 * Runtime: node
 * Governing contract: owner decision D6 (internal and demo scopes first, everyone after 24 hours when nothing
 *                     failed); app-shells 16 (point 4: canary promotion is health-gated).
 */
import type { CanarySample } from "#node/types/canary-sample.type";
import type { CanarySettings } from "#node/types/canary-settings.type";
import type { CanaryVerdict } from "#node/types/canary-verdict.type";

/** Milliseconds in an hour. */
const HOUR = 3_600_000;

/**
 * What to do with a canary that started at `since`.
 *
 * @throws RangeError when `since` is not an ISO instant or the sample is negative or has more errors than requests.
 * @example
 * canaryVerdict(canary.since, { requests: 5000, errors: 3 }, new Date(), EDGE_PUBLISH_SETTINGS.canary); // "promote"
 */
export function canaryVerdict(
  since: string,
  sample: CanarySample,
  now: Date,
  settings: CanarySettings,
): CanaryVerdict {
  const started = Date.parse(since);
  if (Number.isNaN(started)) throw new RangeError(`"${since}" is not an ISO instant`);
  const { requests, errors } = sample;
  if (!(requests >= 0 && errors >= 0 && errors <= requests))
    throw new RangeError(`Invalid canary sample: ${errors} errors of ${requests} requests`);
  if (requests < settings.minRequests) return "hold";
  if (errors / requests > settings.maxErrorRate) return "rollback";
  return now.getTime() - started >= settings.windowHours * HOUR ? "promote" : "hold";
}
